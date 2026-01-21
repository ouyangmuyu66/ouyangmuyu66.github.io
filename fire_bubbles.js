
(function setupSection5Bubbles(){
  const ROOT = document.querySelector('#section5');
  if (!ROOT) return;

  const layer = ROOT.querySelector('#s5-bubble-layer');
  if (!layer) return;

  // =======================
  // CONFIG
  // =======================
  const START_DELAY_MS = 20; //6500 tested

  const TOTAL = 100;
  const LIFE_MS = 8000;

  const MIN_INTERVAL = 650;
  const MAX_INTERVAL = 1200;

  // ✅ NEW: make the first two spawns more separated
  const FIRST_SPAWN_DELAY_RANGE  = [400, 900];   // after START_DELAY, when the 1st bubble shows
  const SECOND_SPAWN_DELAY_RANGE = [1200, 2200]; // gap between 1st and 2nd bubble
  const MIN_GAP_BETWEEN_SPAWNS   = 950;          // hard minimum gap for all spawns (prevents “too close”)

  const MIN_SIZE = 70;
  const MAX_SIZE = 150;
  const MAX_ONSCREEN = 4;

  const CENTER_DEADZONE = 0.34;
  const MIN_X_SEP = 120;

  const X_WINDOWS = [
    [0.02, 0.18, 1.0],
    [0.18, 0.30, 0.7],
    [0.70, 0.82, 0.7],
    [0.82, 0.98, 1.0],
  ];

  const BASE_DIR = 'images/bubbles/';
  const EXT_CANDIDATES = ['png','gif','webp','jpg','jpeg'];

  // =======================
  // STATE
  // =======================
  let playlist = [];
  let nextIndex = 0;
  let onscreen = 0;

  let timer = null;
  let startDelayTimer = null;

  let enabled = false;
  let stopped = false;
  let started = false;

  let lastX = null;

  // ✅ NEW: track last spawn time to enforce minimum gap
  let lastSpawnAt = 0;

  // =======================
  // HELPERS
  // =======================
  const rand  = (min, max) => min + Math.random() * (max - min);
  const randi = (min, max) => Math.floor(rand(min, max + 1));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function weightedPick(windows){
    let sum = 0;
    for (const w of windows) sum += w[2];
    let t = Math.random() * sum;
    for (const [a,b,wt] of windows){
      t -= wt;
      if (t <= 0) return [a,b];
    }
    const [a,b] = windows[windows.length - 1];
    return [a,b];
  }

  function pickSafeX(size){
    const w = layer.clientWidth || 1;
    const maxX = Math.max(0, w - size);

    const dead = CENTER_DEADZONE * w;
    const cx0 = (w - dead) / 2;
    const cx1 = (w + dead) / 2;

    for (let attempt = 0; attempt < 6; attempt++){
      const [ra, rb] = weightedPick(X_WINDOWS);
      let x = rand(ra * w, rb * w);
      x = clamp(x, 0, maxX);

      const xRight = x + size;
      const overlapsCenter = !(xRight < cx0 || x > cx1);
      if (overlapsCenter) continue;

      if (lastX != null && Math.abs(x - lastX) < MIN_X_SEP) continue;

      lastX = x;
      return x;
    }

    let x = Math.random() < 0.5 ? rand(0, w*0.28) : rand(w*0.72, w);
    x = clamp(x, 0, maxX);
    lastX = x;
    return x;
  }

  async function resolveSrc(i){
    for (const ext of EXT_CANDIDATES){
      const url = `${BASE_DIR}${i}.${ext}`;
      try{
        const res = await fetch(url, { method:'HEAD' });
        if (res.ok) return url;
      }catch(e){}
    }
    return null;
  }

  async function buildPlaylist(){
    playlist = [];
    for (let i = 1; i <= TOTAL; i++){
      const url = await resolveSrc(i);
      if (url) playlist.push({ i, url });
    }
  }

  // =======================
  // SPAWN
  // =======================
  function spawnBubble(item){
    if (!enabled || stopped) return false;
    if (onscreen >= MAX_ONSCREEN) return false;

    const w = layer.clientWidth  || 1;
    const h = layer.clientHeight || 1;

    const size = randi(MIN_SIZE, MAX_SIZE);
    const x = pickSafeX(size);

    const y0 = h - size * 0.35;
    const y1 = -size * 0.65;

    const side = (x + size/2) < w/2 ? 'L' : 'R';
    const driftBase = side === 'L' ? rand(-60, 25) : rand(-25, 60);
    const x1 = clamp(x + driftBase, 0, w - size);

    const el = document.createElement('div');
    el.className = 's5-bubble';

    el.style.setProperty('--size', `${size}px`);
    el.style.setProperty('--x0', `${x}px`);
    el.style.setProperty('--y0', `${y0}px`);
    el.style.setProperty('--x1', `${x1}px`);
    el.style.setProperty('--y1', `${y1}px`);

    const inner = document.createElement('div');
    inner.className = 's5-bubble-inner';

    // wobble randomization (left-right)
    inner.style.setProperty('--wobbleAmp', `${rand(6, 18)}px`);
    inner.style.setProperty('--wobbleDur', `${randi(2900, 3800)}ms`);
    inner.style.setProperty('--wobbleDelay', `${randi(-900, 0)}ms`);

    const img = document.createElement('img');
    img.className = 's5-bubble-emoji-img';
    img.src = item.url;
    img.alt = `bubble-${item.i}`;
    img.draggable = false;

    const frame = document.createElement('div');
    frame.className = 's5-bubble-frame';

    inner.appendChild(img);
    inner.appendChild(frame);
    el.appendChild(inner);
    layer.appendChild(el);

    el.style.animation = `s5BubbleFloat ${LIFE_MS}ms linear forwards`;

    onscreen++;
    lastSpawnAt = Date.now(); // ✅ update last spawn time

    setTimeout(() => {
      el.remove();
      onscreen = Math.max(0, onscreen - 1);
    }, LIFE_MS + 80);

    return true;
  }

  // =======================
  // SCHEDULER
  // =======================
  function nextDelay(){
    // special delays for the first two spawns
    if (nextIndex === 0) return randi(FIRST_SPAWN_DELAY_RANGE[0], FIRST_SPAWN_DELAY_RANGE[1]);
    if (nextIndex === 1) return randi(SECOND_SPAWN_DELAY_RANGE[0], SECOND_SPAWN_DELAY_RANGE[1]);
    return randi(MIN_INTERVAL, MAX_INTERVAL);
  }

  function scheduleNext(){
    if (!enabled || stopped) return;
    if (!playlist.length) return;

    if (nextIndex >= playlist.length){
      stopped = true;
      return;
    }

    // base random delay
    let delay = nextDelay();

    // ✅ enforce minimum gap between spawns (prevents “two at once”)
    const sinceLast = Date.now() - lastSpawnAt;
    const needMore = MIN_GAP_BETWEEN_SPAWNS - sinceLast;
    if (needMore > 0) delay = Math.max(delay, needMore);

    timer = setTimeout(() => {
      if (spawnBubble(playlist[nextIndex])) nextIndex++;
      scheduleNext();
    }, delay);
  }

  function bubbleStart(){
    enabled = true;
    if (started) { scheduleNext(); return; }

    startDelayTimer = setTimeout(() => {
      if (!enabled) return;
      started = true;
      lastSpawnAt = 0; // reset spawn gap tracking on start
      scheduleNext();
    }, START_DELAY_MS);
  }

  function bubbleStop(){
    enabled = false;
    if (timer) { clearTimeout(timer); timer = null; }
    if (startDelayTimer) { clearTimeout(startDelayTimer); startDelayTimer = null; }
    started = false;
    lastX = null;
    lastSpawnAt = 0;
  }

  // =======================
  // VISIBILITY CONTROL
  // =======================
  const io = new IntersectionObserver(async ([entry]) => {
    if (!entry) return;
    if (entry.isIntersecting){
      if (!playlist.length) await buildPlaylist();
      bubbleStart();
    } else {
      bubbleStop();
    }
  }, { threshold: 0.35 });

  io.observe(ROOT);
})();
