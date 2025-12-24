// anim.js (replace entire file)
(function () {
  // -------------------------- Typing animation (quote-right exactly like original, gif reveal restored) --------------------------
  function prepareTypingElement(el) {
    if (el.dataset.prepared === "true") return;
    el.dataset.prepared = "true";

    el.style.visibility = "hidden";
    const children = Array.from(el.childNodes);
    el.textContent = "";

    children.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        for (let i = 0; i < text.length; i++) {
          const span = document.createElement("span");
          span.textContent = text[i];
          span.style.opacity = 0;
          el.appendChild(span);
        }
      } else {
        // Keep non-text nodes, but hide delayed gifs until the paragraph finishes
        if (node.tagName === 'IMG' && node.classList.contains('delayed')) {
          node.style.visibility = 'hidden';
        }
        el.appendChild(node);
      }
    });
  }

  function playTypingForElement(el, speed, onComplete) {
    prepareTypingElement(el);
    el.style.visibility = "visible";

    const spans = Array.from(el.querySelectorAll('span'));
    if (spans.length === 0) {
      // reveal delayed gif if present and finish immediately
      const gifFallback = el.querySelector('img.delayed');
      if (gifFallback) gifFallback.style.visibility = "visible";
      if (onComplete) onComplete();
      return;
    }

    const quoteRight = el.parentElement ? el.parentElement.querySelector('.quote-right') : null;
    if (quoteRight) {
      quoteRight.style.opacity = 1;
      // small transition for per-letter snap (keeps original snapping feel)
      quoteRight.style.transition = 'transform 0.05s linear';
    }

    let index = 0;
    let lastTime = performance.now();
    let acc = 0;
    const perChar = Math.max(10, speed);

    function step(now) {
      const dt = now - lastTime;
      lastTime = now;
      acc += dt;

      while (acc >= perChar && index < spans.length) {
        const s = spans[index];
        s.style.opacity = 1;

        if (quoteRight) {
          try {
            // per-letter positioning (as in your original behavior)
            const rect = s.getBoundingClientRect();
            const parentRect = el.parentElement.getBoundingClientRect();
            const x = rect.right - parentRect.left;
            const y = rect.top - parentRect.top;
            quoteRight.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
          } catch (e) {
            // ignore any DOM reading errors
          }
        }

        index++;
        acc -= perChar;
      }

      if (index >= spans.length) {
        // reveal delayed gif exactly like your original code
        const gif = el.querySelector('img.delayed');
        if (gif) gif.style.visibility = "visible";

        // final position snap to the end of the element (exact style as original)
        if (quoteRight) {
          try {
            const elRect = el.getBoundingClientRect();
            const parentRect = el.parentElement.getBoundingClientRect();
            const finalX = elRect.right - parentRect.left;
            const finalY = elRect.top - parentRect.top;
            quoteRight.style.transform = `translate(${Math.round(finalX)}px, ${Math.round(finalY)}px)`;
          } catch (e) {
            // ignore
          }
        }

        if (onComplete) setTimeout(onComplete, 50);
        return;
      }

      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function playGroup(group) {
    if (group.dataset.played === "true") return;
    group.dataset.played = "true";

    const items = Array.from(group.querySelectorAll(".typing"));
    let idx = 0;

    function next() {
      if (idx >= items.length) return;
      const el = items[idx];
      const speed = parseInt(el.getAttribute("data-speed"), 10) || 60;
      playTypingForElement(el, speed, () => {
        idx++;
        next();
      });
    }

    next();
  }

  function observeGroups() {
    const groups = document.querySelectorAll(".typing-group");

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          playGroup(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    groups.forEach(group => observer.observe(group));
  }

  document.addEventListener("DOMContentLoaded", observeGroups);

  // -------------------------- Canvas starfield w/ glow --------------------------
  (function () {
    const canvas = document.getElementById('star-field');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let w = 0, h = 0, cx = 0, cy = 0;
    const DEPTH = 8;
    const BASE_SPEED = 0.0028;
    const STAR_COUNT = 80;
    const BASE_SIZE = 2.2;
    let stars = [];

    function resize() {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      w = canvas.clientWidth = window.innerWidth;
      h = canvas.clientHeight = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w * 0.62;
      cy = h * 0.5;
      initStars();
      drawBackground();
    }

    function initStars() {
      stars = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: (Math.random() - 0.5) * w,
          y: (Math.random() - 0.5) * h,
          z: Math.random() * DEPTH + 0.5,
          color: Math.random()
        });
      }
    }

    function resetStar(s) {
      s.x = (Math.random() - 0.5) * w;
      s.y = (Math.random() - 0.5) * h;
      s.z = DEPTH;
      s.color = Math.random();
    }

    function drawBackground() {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#030614');
      g.addColorStop(0.35, '#112049');
      g.addColorStop(0.6, '#4c32a8');
      g.addColorStop(1, '#ffdf89');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    let last = performance.now();
    function animate(now) {
      const dt = now - last;
      last = now;

      drawBackground();

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.z -= BASE_SPEED * dt;
        if (s.z <= 0.12) {
          resetStar(s);
          continue;
        }
        const scale = 1 / s.z;
        const x = cx + s.x * scale;
        const y = cy + s.y * scale;
        const size = Math.max(0.5, BASE_SIZE * scale);
        const alpha = s.z < 2 ? Math.max(s.z / 2, 0) : 1.0;

        let base;
        if (s.color < 0.25) base = '255,255,255';
        else if (s.color < 0.6) base = '191,187,64';
        else if (s.color < 0.8) base = '68,68,255';
        else base = '255,68,68';

        const glowRadius = size * 6;
        const rg = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        rg.addColorStop(0, `rgba(${base}, ${alpha * 0.9})`);
        rg.addColorStop(0.3, `rgba(${base}, ${alpha * 0.45})`);
        rg.addColorStop(1, `rgba(${base}, 0)`);

        ctx.beginPath();
        ctx.fillStyle = rg;
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = `rgba(${base}, ${Math.min(1, alpha + 0.2)})`;
        ctx.arc(x, y, Math.max(0.6, size * 0.55), 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(animate);
    }

    function debounce(fn, ms) {
      let t;
      return function () {
        clearTimeout(t);
        t = setTimeout(() => fn(), ms);
      };
    }

    window.addEventListener('resize', debounce(resize, 120));
    resize();
    initStars();
    requestAnimationFrame(animate);
  })();

  // -------------------- Scroll button ------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll('.scroll-button');

    buttons.forEach(button => {
      const section = button.closest('section');
      if (!section) return;

      if (!section.nextElementSibling) {
        button.style.display = 'none';
        return;
      }

      section.style.position = section.style.position || 'relative';

      button.addEventListener('click', () => {
        const next = section.nextElementSibling;
        if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, { passive: true });
    });
  });
})();
