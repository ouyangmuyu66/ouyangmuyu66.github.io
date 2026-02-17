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
            const yOffset = -15; // loc of quote
            const xOffset = 25;
            quoteRight.style.left = (letterRect.right - containerRect.left + xOffset) + 'px';
            quoteRight.style.top  = (letterRect.top - containerRect.top + yOffset) + 'px';
          }

          if (index === letters.length - 1) {
            const gif = el.querySelector('img.delayed');
            if (gif) gif.style.visibility = "visible";

            if (quoteRight) {
              const container = el.parentElement;
              const containerRect = container.getBoundingClientRect();
              let finalLeft = containerRect.width;
              

              // right quote end move right
              let leftShift = containerRect.width * 0.03; 

              // Optional: increase shift on very small screens
              // if (window.innerWidth < 1300) leftShift = containerRect.width * 0.01; //bigger move to left

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
      const speed = parseInt(el.getAttribute("data-speed"), 10) || 60; //type time
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
    }, { threshold: 0.6 });

    groups.forEach(group => observer.observe(group));
  }

  document.addEventListener("DOMContentLoaded", observeGroups);

  // ✅ expose a re-init hook for iPad / after unlock
  window.reobserveTypingGroups = function () {
    observeGroups();
  };


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

    const colors = ['white','yellow','blue','red'];
    const c = colors[Math.floor(Math.random() * colors.length)];

    el.className = `star ${c}`;
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
      const colorBoost = Math.min(1.2, 1 / star.z);
      star.el.style.filter = `brightness(${colorBoost})`;
      
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


















/* THINKING BUBBLE JS - paste into anim.js (bottom) */

/**
 * Behavior:
 * - Only avatars that are inside a `.thinking-enabled` message-row get the bubble feature.
 * - When avatar gets `.is-focus` class, we add `.active` to its .thinking-bubble to play animation.
 * - Animation sequence auto-cleans after DURATION_TOTAL so it can re-trigger next time.
 * - Click on avatar replays animation instantly.
 * - Respects prefers-reduced-motion by skipping heavy animations.
 */

(function(){
  const HOLD_MS = 2200; // how long bubble stays fully visible after animation (adjust)
  const TOTAL_MS = 560 + 360 + HOLD_MS; // matches delays in CSS (dots + bubble-in + hold)
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setupThinkingForAvatar(avatarEl) {
    // find the thinking bubble inside this avatar
    const bubble = avatarEl.querySelector('.thinking-bubble');
    if (!bubble) return;

    // utility to play animation
    function playOnce(force=false) {
      // If prefers reduced motion, make bubble visible briefly without animation
      if (REDUCED) {
        bubble.classList.add('active');
        setTimeout(()=> bubble.classList.remove('active'), 1200);
        return;
      }

      // remove then re-add class to replay CSS animations
      bubble.classList.remove('active');

      // Force reflow to restart animations
      // eslint-disable-next-line
      void bubble.offsetWidth;

      bubble.classList.add('active');

      // clear after TOTAL_MS so it can be re-triggered next time
      clearTimeout(bubble.__thinkingTimer);
      bubble.__thinkingTimer = setTimeout(()=> {
        bubble.classList.remove('active');
      }, TOTAL_MS);
    }

    // if avatar is clicked, replay
    avatarEl.addEventListener('click', (e)=>{
      playOnce(true);
    });

    // monitor class attribute changes on avatar (.is-focus toggles)
    const mo = new MutationObserver((records)=>{
      for (const rec of records) {
        if (rec.attributeName === 'class') {
          const focused = avatarEl.classList.contains('is-focus');
          if (focused) {
            playOnce();
          } else {
            // optionally hide when focus is removed
            // bubble.classList.remove('active');
          }
        }
      }
    });
    mo.observe(avatarEl, { attributes: true, attributeFilter: ['class'] });

    // also return the observer for potential cleanup
    return mo;
  }

  // init: find all avatar elements that are inside a thinking-enabled message row
  function initAllThinking() {
    const rows = document.querySelectorAll('.message-row.thinking-enabled');
    rows.forEach(row => {
      const avatar = row.querySelector('.avatar');
      if (!avatar) return;
      // ensure a bubble exists — if not, create one fallback (optional)
      if (!avatar.querySelector('.thinking-bubble')) {
        // (optional) create minimal bubble; but prefer to include in HTML for content
        const frag = document.createElement('div');
        frag.className = 'thinking-bubble side-right';
        frag.innerHTML = '<div class="dots"><span class="dot d1"></span><span class="dot d2"></span><span class="dot d3"></span></div><div class="main-bubble">…</div>';
        avatar.appendChild(frag);
      }
      // setup mutation observer and click handlers
      setupThinkingForAvatar(avatar);
    });
  }

  // run on DOMContentLoaded and also when you dynamically add rows, you can call initAllThinking again
  document.addEventListener('DOMContentLoaded', initAllThinking);

  // expose function for re-init if you dynamically add message rows later:
  window.initThinkingBubbles = initAllThinking;
})();









function toggleAvatarFocus(el) {
  const row = el.closest('.message-row');
  const willFocus = !el.classList.contains('is-focus');

  // stop auto sequence if needed
  if (window._cleanupAvatarFocus) window._cleanupAvatarFocus();

  // clear previous manual timer
  if (manualFocusTimer) { clearTimeout(manualFocusTimer); manualFocusTimer = null; }

  if (willFocus) {
    document.body.classList.add('focus-mode');
    if (row) row.classList.add('is-focus-row');
    el.classList.add('is-focus');

    moveRowToTop(row, true);

    // ✅ auto return after 2s (change to what you want)
    scheduleAutoUnfocus(el, 2000);

  } else {
    unfocusAvatar(el);
  }
}











function updateFocusMode() {
  const focusedAvatar = document.querySelector('.avatar.is-focus');
  const overlay = document.getElementById('focus-overlay');

  // clear old focus-row marks
  document.querySelectorAll('.message-row.is-focus-row')
    .forEach(r => r.classList.remove('is-focus-row'));

  if (!focusedAvatar) {
    document.body.classList.remove('focus-mode');
    return;
  }

  document.body.classList.add('focus-mode');

  // mark the row that contains the focused avatar
  const row = focusedAvatar.closest('.message-row');
  if (row) row.classList.add('is-focus-row');

  // click overlay to exit focus
  if (overlay && !overlay.__boundClose) {
    overlay.__boundClose = true;
    overlay.addEventListener('click', () => {
      document.querySelectorAll('.avatar.is-focus')
        .forEach(a => a.classList.remove('is-focus'));
      updateFocusMode();
    });
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('focus-overlay');
  if (!overlay) return;

  overlay.addEventListener('click', () => {
    document.querySelectorAll('.avatar.is-focus').forEach(a => a.classList.remove('is-focus'));
    document.querySelectorAll('.message-row.is-focus-row').forEach(r => r.classList.remove('is-focus-row'));
    document.body.classList.remove('focus-mode');
  });
});












let manualFocusTimer = null;

function unfocusAvatar(el){
  const row = el.closest('.message-row');

  // ✅ force-hide thinking bubble immediately
  el.querySelectorAll('.thinking-bubble').forEach(b => b.classList.remove('active'));

  el.classList.remove('is-focus');
  if (row) row.classList.remove('is-focus-row');

  moveRowToTop(row, false);

  if (!document.querySelector('.avatar.is-focus')) {
    document.body.classList.remove('focus-mode');
  }
}



function scheduleAutoUnfocus(el, ms = 2000){
  if (manualFocusTimer) clearTimeout(manualFocusTimer);
  manualFocusTimer = setTimeout(() => {
    // only unfocus if it's still focused
    if (el && el.classList.contains('is-focus')) {
      unfocusAvatar(el);
    }
    manualFocusTimer = null;
  }, ms);
}

