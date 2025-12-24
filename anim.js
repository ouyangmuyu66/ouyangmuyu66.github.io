// anim.js
(function () {
  // -------------------------- Typing animation (RAF-driven) --------------------------
  // Uses a single requestAnimationFrame loop per typing group to reveal characters.
  function prepareTypingElement(el) {
    // Convert text nodes into spans (but do it once)
    if (el.dataset.prepared === "true") return;
    el.dataset.prepared = "true";

    el.style.visibility = "hidden";
    const children = Array.from(el.childNodes);
    el.textContent = ""; // clear

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
        // keep nodes (images etc.) as-is, hide delayed gifs
        if (node.tagName === 'IMG' && node.classList.contains('delayed')) {
          node.style.visibility = 'hidden';
        }
        el.appendChild(node);
      }
    });
  }

  function playTypingForElement(el, speed, onComplete) {
    // speed is ms per char (like before)
    prepareTypingElement(el);
    el.style.visibility = "visible";
    const spans = Array.from(el.querySelectorAll('span'));
    if (spans.length === 0) {
      // if empty, finish immediately
      if (onComplete) onComplete();
      return;
    }

    const quoteRight = el.parentElement ? el.parentElement.querySelector('.quote-right') : null;
    if (quoteRight) {
      quoteRight.style.opacity = 1; // make visible immediately (will animate later)
      quoteRight.style.transform = 'translateX(0px)';
    }

    let index = 0;
    let lastTime = performance.now();
    let acc = 0;
    const perChar = Math.max(10, speed); // avoid extremely small values

    function step(now) {
      const dt = now - lastTime;
      lastTime = now;
      acc += dt;

      // reveal as many characters as the elapsed time allows
      while (acc >= perChar && index < spans.length) {
        spans[index].style.opacity = 1;
        index++;
        acc -= perChar;
      }

      if (index >= spans.length) {
        // done
        // reveal delayed image if present
        const gif = el.querySelector('img.delayed');
        if (gif) gif.style.visibility = "visible";

        // animate quote-right to an approximate final place (no layout reads per letter)
        if (quoteRight) {
          quoteRight.style.opacity = 1;
          quoteRight.style.transform = 'translateX(8px)';
          // small timeout to ensure final placement is visible
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 120);
        } else {
          if (onComplete) onComplete();
        }
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

  // -------------------------- Canvas starfield (single canvas) --------------------------
  (function () {
    const canvas = document.getElementById('star-field');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let w = 0, h = 0, cx = 0, cy = 0;
    let stars = [];
    const DEPTH = 8;
    const BASE_SPEED = 0.0028; // tune this
    const STAR_COUNT = 80;     // reduce count to be mobile-friendly — you can increase if needed
    const BASE_SIZE = 2.2;

    function resize() {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      w = canvas.clientWidth = window.innerWidth;
      h = canvas.clientHeight = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w * 0.62;
      cy = h * 0.5;
      // recreate stars on major resizes
      initStars();
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

    // pre-render a subtle gradient background to canvas once for lower paint cost
    function drawBackground() {
      // draw gradient background (cheap)
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

      // clear efficiently (single rectangle)
      drawBackground();

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.z -= BASE_SPEED * (dt);
        if (s.z <= 0.12) {
          resetStar(s);
          continue;
        }
        const scale = 1 / s.z;
        const x = cx + s.x * scale;
        const y = cy + s.y * scale;
        const size = Math.max(0.6, BASE_SIZE * scale);
        const alpha = s.z < 2 ? Math.max(s.z / 2, 0) : 1.0;

        // color mixing simple
        const col = (s.color < 0.25) ? `rgba(255,255,255,${alpha})` :
                    (s.color < 0.6) ? `rgba(191,187,64,${alpha})` :
                    (s.color < 0.8) ? `rgba(68,68,255,${alpha})` :
                                     `rgba(255,68,68,${alpha})`;

        ctx.beginPath();
        ctx.fillStyle = col;
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(animate);
    }

    window.addEventListener('resize', debounce(resize, 120));
    resize();
    initStars();
    // draw background once to avoid initial blank
    drawBackground();
    requestAnimationFrame(animate);

    // simple debounce helper to avoid many resizes
    function debounce(fn, ms) {
      let t;
      return function () {
        clearTimeout(t);
        t = setTimeout(() => fn(), ms);
      };
    }
  })();

  // -------------------- Scroll button behaviour (unchanged, light) ------------------------------
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
