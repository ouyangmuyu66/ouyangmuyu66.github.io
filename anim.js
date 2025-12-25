(function () {

  function typeElement(el, speed, done, cursorSpeed = 0.5) { 
    // cursorSpeed = multiplier of typing speed, e.g., 0.5 = cursor moves faster
    el.style.visibility = "visible";

    const children = Array.from(el.childNodes);
    const letters = [];
    el.textContent = "";

    const quoteRight = el.parentElement.querySelector('.quote-right');
    if (quoteRight) quoteRight.style.opacity = 1;

    children.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        for (let i = 0; i < text.length; i++) {
          const span = document.createElement("span");
          span.textContent = text[i];
          span.style.opacity = 0;
          el.appendChild(span);
          letters.push(span);
        }
      } else {
        if (node.tagName === 'IMG' && node.classList.contains('delayed')) {
          node.style.visibility = 'hidden';
        }
        el.appendChild(node);
      }
    });

    for (let i = 0; i < letters.length; i++) {
      (function(index) {
        setTimeout(function() {
          letters[index].style.opacity = 1;

          if (quoteRight) {
            const letterRect = letters[index].getBoundingClientRect();
            const containerRect = el.parentElement.getBoundingClientRect();
            // animate cursor separately, faster than typing
            quoteRight.style.transition = `left ${speed * cursorSpeed}ms linear, top ${speed * cursorSpeed}ms linear`;
            quoteRight.style.left = (letterRect.right - containerRect.left) + 'px';
            quoteRight.style.top  = (letterRect.top - containerRect.top) + 'px';
          }

          if (index === letters.length - 1) {
            const gif = el.querySelector('img.delayed');
            if (gif) gif.style.visibility = "visible";

            if (quoteRight) {
              const container = el.parentElement;
              const containerRect = container.getBoundingClientRect();
              let finalLeft = containerRect.width;
              

              // Proportional left shift based on container width
              let leftShift = containerRect.width * 0.01; // move 5% of container width to left by default

              // Optional: increase shift on very small screens
              if (window.innerWidth < 1300) leftShift = containerRect.width * 0.05; //bigger move to left

              finalLeft -= leftShift; // subtract to move left
             

              quoteRight.style.transition = 'left 0.2s ease-out, top 0.2s ease-out';
              quoteRight.style.left = finalLeft + 'px';
              
            }

            if (done) setTimeout(done, speed);
          }
        }, index * speed);
      })(i);
    }
  }

  function playGroup(group) {
    if (group.dataset.played === "true") return;
    group.dataset.played = "true";

    const items = group.querySelectorAll(".typing");
    let index = 0;

    function playNext() {
      if (index >= items.length) return;

      const el = items[index];
      const speed = parseInt(el.getAttribute("data-speed"), 10) || 10;
      const cursorSpeed = parseFloat(el.getAttribute("data-cursor-speed")) || 0.0;

      typeElement(el, speed, function() {
        index++;
        playNext();
      }, cursorSpeed);
    }

    playNext();
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
    }, { threshold: 0.5 });

    groups.forEach(group => observer.observe(group));
  }

  document.addEventListener("DOMContentLoaded", observeGroups);

})();



// -------------------- Star field (unchanged) -------------------------------
(function () {

  const STAR_COUNT = 120; // number of stars
  const SPEED = 0.03;   // forward movement speed
  const DEPTH = 8;        // depth of field
  const BASE_SIZE = 3;
  const FADE_START = 2;

  const field = document.getElementById('star-field');
  if (!field) return;

  const stars = [];
  let w, h, vpX, vpY;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    vpX = w * 0.62;
    vpY = h * 0.5;
  }

  window.addEventListener('resize', resize);
  resize();

  function createStar() {
    const el = document.createElement('div');
    el.className = 'star';
    field.appendChild(el);

    return {
      el,
      x: (Math.random() - 0.5) * w,
      y: (Math.random() - 0.5) * h,
      z: Math.random() * DEPTH + 0.5
    };
  }

  function resetStar(star) {
    star.x = (Math.random() - 0.5) * w;
    star.y = (Math.random() - 0.5) * h;
    star.z = DEPTH;
  }

  for (let i = 0; i < STAR_COUNT; i++) stars.push(createStar());

  function animate() {
    for (const star of stars) {
      star.z -= SPEED;
      if (star.z <= 0.15) {
        resetStar(star);
        continue;
      }
      const scale = 1 / star.z;
      const x = vpX + star.x * scale;
      const y = vpY + star.y * scale;
      const size = BASE_SIZE * scale;
      const opacity = (star.z < FADE_START)
        ? Math.max(star.z / FADE_START, 0)
        : 1;
      // Use translate3d to trigger GPU acceleration
      star.el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${size})`; 
      star.el.style.opacity = opacity;
    }
    requestAnimationFrame(animate);
  }

  animate();

})();


// -------------------- Scroll button behaviour ------------------------------
document.addEventListener('DOMContentLoaded', () => {
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
    });
  });
});
