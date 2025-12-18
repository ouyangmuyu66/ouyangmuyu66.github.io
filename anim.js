(function () {

  function typeElement(el, speed, done) {
    el.style.visibility = "visible"; //show text only when typing animation start
    var text = el.textContent;
    el.textContent = "";

    var letters = [];
    for (var i = 0; i < text.length; i++) {
      var span = document.createElement("span");
      span.textContent = text[i];
      span.style.opacity = 0;
      el.appendChild(span);
      letters.push(span);
    }

    for (let i = 0; i < letters.length; i++) {
      (function (index) {
        setTimeout(function () {
          letters[index].style.opacity = 1;

          // when last letter finishes
          if (index === letters.length - 1 && done) {
            setTimeout(done, speed);
          }
        }, index * speed);
      })(i);
    }
  }

  function playGroup(group) {
    if (group.dataset.played === "true") return;
    group.dataset.played = "true";

    var items = group.querySelectorAll(".typing");
    var index = 0;

    function playNext() {
      if (index >= items.length) return;

      var el = items[index];
      var speed = parseInt(el.getAttribute("data-speed"), 10) || 50;

      typeElement(el, speed, function () {
        index++;
        playNext();
      });
    }

    playNext();
  }

  function observeGroups() {
    var groups = document.querySelectorAll(".typing-group");

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          playGroup(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.5
    });

    groups.forEach(function (group) {
      observer.observe(group);
    });
  }

  document.addEventListener("DOMContentLoaded", observeGroups);

})();


/* Star field: initialize after DOM ready */
(function () {

  const STAR_COUNT = 120;
  const SPEED = 0.0035;           // forward movement speed
  const DEPTH = 8;               // how deep space is
  const BASE_SIZE = 2.2;
  const FADE_START = 1.4;        // when stars start fading

  const field = document.getElementById('star-field');
  const stars = [];

  let w, h, vpX, vpY;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;

    // 🔹 Vanishing point: slightly right of center
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

  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push(createStar());
  }

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

      const opacity =
        star.z < FADE_START
          ? Math.max(star.z / FADE_START, 0)
          : 1;

      star.el.style.transform =
        `translate(${x}px, ${y}px) scale(${size})`;
      star.el.style.opacity = opacity;
    }

    requestAnimationFrame(animate);
  }

  animate();

})();
