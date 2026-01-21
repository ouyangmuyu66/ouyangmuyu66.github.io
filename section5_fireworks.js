/* ===================== SECTION 5 FIREWORKS (JS) ===================== */
(() => {
  const section = document.getElementById("section5");
  if (!section) return;

  const stage = section.querySelector(".s5-stage");
  const video = section.querySelector(".s5-bgvideo");
  const canvas = section.querySelector(".s5-fireworks");
  if (!stage || !video || !canvas) return;

  // -------------------- asset paths --------------------
  const SPRITE_URL = "images/firework-burst-icon-v2.png";
  const DEMO_URL = "images/demo.webp"; // optional core flare

  // -------------------- helpers --------------------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);

  function parseNums(str, fallbackArr) {
    if (!str) return fallbackArr;
    const arr = str
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !Number.isNaN(n));
    return arr.length ? arr : fallbackArr;
  }

  // -------------------- config (data-attrs) --------------------
  let [ax, ay, aw, ah] = parseNums(stage.dataset.fwArea, [0.15, 0.55, 0.7, 0.4]);
  let [minSize, maxSize] = parseNums(stage.dataset.fwSize, [0.75, 1.35]);
  let rate = parseFloat(stage.dataset.fwRate || "0.9");

  ax = clamp(ax, 0, 1);
  ay = clamp(ay, 0, 1);
  aw = clamp(aw, 0, 1);
  ah = clamp(ah, 0, 1);
  minSize = clamp(minSize, 0.2, 5);
  maxSize = clamp(maxSize, minSize, 6);
  rate = clamp(rate, 0.1, 8);

  // -------------------- canvas + hiDPI --------------------
  const ctx = canvas.getContext("2d", { alpha: true });
  let dpr = 1,
    W = 0,
    H = 0;

  function resize() {
    const rect = stage.getBoundingClientRect();
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1)); // cap for perf
    W = Math.max(1, Math.floor(rect.width));
    H = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  // -------------------- image loader --------------------
  function loadImg(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  let spritePNG = null;
  let demoWEBP = null;

  // -------------------- particles data --------------------
  const shells = [];
  const sparks = [];
  const trails = [];

  let raf = 0;
  let running = false;
  let assetsReady = false;

  // -------------------- drawing --------------------
  function drawSprite(img, x, y, size, alpha, hueRotateDeg = 0) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = "lighter";
    ctx.filter = hueRotateDeg ? `hue-rotate(${hueRotateDeg}deg)` : "none";
    const half = size * 0.5;
    ctx.drawImage(img, x - half, y - half, size, size);
    ctx.restore();
  }

  function fadeFrame() {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.12; // lower = longer trails
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // -------------------- behavior --------------------
  function launchShell() {
    const rect = stage.getBoundingClientRect();

    const xInArea = (ax + rand(0, aw)) * rect.width;
    const yInArea = (ay + rand(0, ah)) * rect.height;

    const startX = xInArea;
    const startY = (ay + ah) * rect.height + rand(40, 140);

    const burstX = xInArea + rand(-rect.width * 0.03, rect.width * 0.03);
    const burstY = yInArea + rand(-rect.height * 0.03, rect.height * 0.03);

    const scale = rand(minSize, maxSize);

    const life = rand(650, 980);
    const vx = (burstX - startX) / life;
    const vy = (burstY - startY) / life;

    shells.push({
      x: startX,
      y: startY,
      vx,
      vy,
      t: 0,
      life,
      scale,
      hue: rand(0, 360),
    });
  }

  function burst(x, y, scale, hueBase) {
    trails.push({
      kind: "core",
      x,
      y,
      size: 220 * scale,
      age: 0,
      life: 220,
      hue: hueBase,
    });

    const count = Math.floor(rand(80, 140) * scale);
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const speed = rand(1.1, 3.8) * scale;
      const ringBias = rand(0.6, 1.15);

      sparks.push({
        x,
        y,
        vx: Math.cos(a) * speed * ringBias,
        vy: Math.sin(a) * speed * ringBias,
        g: 0.018 + rand(0, 0.016),
        drag: 0.985 + rand(-0.01, 0.005),
        life: rand(900, 1500),
        age: 0,
        size: rand(10, 22) * scale,
        hue: (hueBase + rand(-25, 25) + 360) % 360,
        alpha: 1,
      });
    }
  }

  function glitter(x, y, scale, hueBase) {
    const count = Math.floor(rand(25, 45) * scale);
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const speed = rand(0.6, 1.8) * scale;

      sparks.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        g: 0.02 + rand(0, 0.02),
        drag: 0.975 + rand(-0.01, 0.01),
        life: rand(520, 860),
        age: 0,
        size: rand(6, 14) * scale,
        hue: (hueBase + rand(-40, 40) + 360) % 360,
        alpha: 0.9,
      });
    }
  }

  // -------------------- main loop --------------------
  let last = 0;
  let launchAcc = 0;

  function step(ts) {
    if (!running) return;

    if (!last) last = ts;
    const dt = Math.min(34, ts - last);
    last = ts;

    fadeFrame();

    launchAcc += dt / 1000;
    const interval = 1 / rate;
    while (launchAcc >= interval) {
      launchAcc -= interval;
      launchShell();
    }

    // shells
    for (let i = shells.length - 1; i >= 0; i--) {
      const s = shells[i];
      s.t += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      if (Math.random() < 0.7) {
        trails.push({
          kind: "trail",
          x: s.x + rand(-2, 2),
          y: s.y + rand(-2, 2),
          size: rand(14, 24) * s.scale,
          age: 0,
          life: rand(180, 260),
          hue: s.hue,
        });
      }

      if (spritePNG) drawSprite(spritePNG, s.x, s.y, 26 * s.scale, 0.95, s.hue);

      if (s.t >= s.life) {
        burst(s.x, s.y, s.scale, s.hue);
        if (Math.random() < 0.65) glitter(s.x, s.y, s.scale, s.hue);
        shells.splice(i, 1);
      }
    }

    // trails
    for (let i = trails.length - 1; i >= 0; i--) {
      const t = trails[i];
      t.age += dt;

      const p = t.age / t.life;
      const alpha = (1 - p) * (t.kind === "core" ? 0.55 : 0.35);
      if (alpha <= 0) {
        trails.splice(i, 1);
        continue;
      }

      if (t.kind === "core" && demoWEBP) {
        drawSprite(demoWEBP, t.x, t.y, t.size * (0.92 + p * 0.25), alpha, t.hue);
      } else if (spritePNG) {
        drawSprite(spritePNG, t.x, t.y, t.size * (0.8 + p * 0.2), alpha, t.hue);
      }
    }

    // sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.age += dt;

      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.g * dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const tt = p.age / p.life;
      p.alpha = 1 - tt;

      if (p.alpha <= 0) {
        sparks.splice(i, 1);
        continue;
      }

      if (spritePNG) {
        const size = p.size * (0.95 - 0.35 * tt);
        drawSprite(spritePNG, p.x, p.y, size, p.alpha, p.hue);
      }
    }

    raf = requestAnimationFrame(step);
  }

  // -------------------- start / stop --------------------
  async function ensureAssets() {
    if (assetsReady) return true;

    const [sprite, demo] = await Promise.allSettled([loadImg(SPRITE_URL), loadImg(DEMO_URL)]);
    if (sprite.status === "fulfilled") spritePNG = sprite.value;
    if (demo.status === "fulfilled") demoWEBP = demo.value;

    assetsReady = !!spritePNG;
    return assetsReady;
  }

  function start() {
    if (running) return;
    running = true;
    resize();
    ctx.clearRect(0, 0, W, H);

    // keep your webm bg behavior: only ensure it plays when section is active
    try {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") playPromise.catch(() => {});
    } catch {}

    last = 0;
    launchAcc = 0;
    raf = requestAnimationFrame(step);
  }

  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;

    // if you want the background to keep looping even when out of view, remove these 2 lines:
    video.pause();
    video.currentTime = 0;

    shells.length = 0;
    sparks.length = 0;
    trails.length = 0;
    ctx.clearRect(0, 0, W, H);
  }

  // -------------------- visibility control --------------------
  const io = new IntersectionObserver(
    async (entries) => {
      for (const e of entries) {
        if (e.target !== section) continue;

        if (e.isIntersecting && e.intersectionRatio >= 0.6) {
          await ensureAssets();
          start();
        } else {
          stop();
        }
      }
    },
    { threshold: [0, 0.6, 1] }
  );

  io.observe(section);

  // optional controls
  window.Section5FW = {
    setArea(x, y, w, h) {
      ax = clamp(x, 0, 1);
      ay = clamp(y, 0, 1);
      aw = clamp(w, 0, 1);
      ah = clamp(h, 0, 1);
    },
    setSize(min, max) {
      minSize = clamp(min, 0.2, 5);
      maxSize = clamp(max, minSize, 6);
    },
    setRate(r) {
      rate = clamp(r, 0.1, 8);
    },
    start,
    stop,
  };
})();



