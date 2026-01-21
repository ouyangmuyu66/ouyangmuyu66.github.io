/* js/s5_lyric_player.js
   SECTION 5 only. Fully isolated lyric/text player.
*/
(() => {
  'use strict';

  const ROOT = document.querySelector('#section5');
  if (!ROOT) return;

  const host = ROOT.querySelector('#s5-lyric-player');
  if (!host) return;

  const track = host.querySelector('.s5lp-track');
  if (!track) return;

  // =========================
  // CONFIG (tweak freely)
  // =========================
  const CFG = {
    startDelayMs: 20000,

    perCharDelayMs: 250,
    charAnimMs: 570,

    holdAfterLitMs: 1450,
    swipeMs: 2680,

    lineGapPx: 0,
    respectReducedMotion: true,
  };

  let LINES = [
    '你在我心里一直很重要',
    '是无法替代的那种',

    '我起床的第一件事',
    '是看你的消息',
    '喜欢一个人',
    '会忍不住在意',
    '她的一切',

    '在我眼中',
    '你永远是满分',
    '你接纳了',
    '我的不完美',

    '我在爱你的时候',
    '也在学着相信',
    '我在相信你的时候',
    '依然选择爱你',

    '和你在一起',
    '我感受到了',
    '真正的幸福',
    '你给了我',
    '安全感',

    '黑白色的生命',
    '你出现的时候',
    '我才意识到',
    '原来我还活着',
    '那天你说得很轻',
    '但我听得很认真',
    '你没有说很多',
    '我却记住了',
    '有一段时间',
    '我不太确定',
    '但你还在',
    '就够了',

    '那年晚上',
    '有点慌',
    '屏幕很亮',
    '你还在线',

    '那天的烟花很吵',
    '好漂亮',
    '但我突然很安静',
    '你靠得不近',
    '却刚刚好',
    '有一瞬间',
    '我忘了时间',
    '只记得你',

    '每次烟花响起',
    '我在想你',

    '你的出现',
    '胜过所有'
  ];

  window.setSection5LyricLines = (arr) => {
    if (Array.isArray(arr) && arr.length) LINES = arr.map(String);
  };

  const reduceMotion = CFG.respectReducedMotion &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let running = false;
  let killed = false;
  let timers = new Set();

  function wait(ms) {
    return new Promise((resolve) => {
      const id = setTimeout(() => {
        timers.delete(id);
        resolve();
      }, ms);
      timers.add(id);
    });
  }
  function clearAllTimers() {
    for (const t of timers) clearTimeout(t);
    timers.clear();
  }

  function show() { host.style.display = 'block'; }
  function hide() { host.style.display = 'none'; }

  function splitToChars(text) {
    return Array.from(text);
  }

  // ✅ IMPORTANT: never create truly empty line (keeps height stable)
  function makeLine(text, cls) {
    const el = document.createElement('div');
    el.className = `s5lp-line ${cls || ''}`.trim();

    const safeText = (text && String(text).length) ? String(text) : ' ';
    const chars = splitToChars(safeText);

    for (const ch of chars) {
      const span = document.createElement('span');
      span.className = 's5lp-char';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      el.appendChild(span);
    }

    if (!text || !String(text).length) el.classList.add('is-placeholder');
    return el;
  }

  function setTrackY(px, withTransition) {
    if (withTransition) track.classList.add('is-sliding');
    else track.classList.remove('is-sliding');
    track.style.transform = `translate3d(0, ${px}px, 0)`;
  }

  function fillLine(el, text, makeCurrent) {
    el.classList.remove('is-current', 'is-dim', 'is-placeholder');
    el.classList.add(makeCurrent ? 'is-current' : 'is-dim');

    el.innerHTML = '';
    const safeText = (text && String(text).length) ? String(text) : ' ';
    const chars = splitToChars(safeText);

    for (const ch of chars) {
      const span = document.createElement('span');
      span.className = 's5lp-char';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      el.appendChild(span);
    }

    if (!text || !String(text).length) el.classList.add('is-placeholder');
  }

  async function animateCurrentLineChars(currentEl) {
    const spans = Array.from(currentEl.querySelectorAll('.s5lp-char'));
    if (!spans.length) return;

    if (reduceMotion) {
      for (const s of spans) {
        s.style.animation = 'none';
        s.style.color = '#fff';
        s.style.textShadow =
          '0 0 10px rgba(255,120,210,0.85), 0 0 24px rgba(255,120,210,0.55), 0 0 44px rgba(255,120,210,0.25)';
      }
      return;
    }

    spans.forEach((s, i) => {
      s.style.animation = 'none';
      s.style.animationDelay = '0ms';
      // force reflow for reliable restart
      // eslint-disable-next-line no-unused-expressions
      s.offsetHeight;

      s.style.animation = `s5lp-charLight ${CFG.charAnimMs}ms ease forwards`;
      s.style.animationDelay = `${i * CFG.perCharDelayMs}ms`;
    });

    const totalMs = (spans.length - 1) * CFG.perCharDelayMs + CFG.charAnimMs;
    await wait(totalMs);
  }

  async function runPlayer() {
    if (running) return;
    running = true;
    killed = false;
    host.classList.remove('s5lp-fadeout');

    track.innerHTML = '';
    track.style.opacity = '1';
    setTrackY(0, false);
    show();

    if (!LINES || !LINES.length) {
      hide();
      running = false;
      return;
    }

    // Build 3 stable lines
    let prev = makeLine('', 'is-dim');
    let curr = makeLine(LINES[0], 'is-current');
    let next = makeLine(LINES[1] ?? '', 'is-dim');

    track.appendChild(prev);
    track.appendChild(curr);
    track.appendChild(next);

    // measure
    await wait(0);
    const rect = curr.getBoundingClientRect();
    const lineH = Math.max(44, rect.height || 0) + CFG.lineGapPx;

    // center current (middle)
    setTrackY(-lineH, false);

    for (let idx = 0; idx < LINES.length; idx++) {
      if (killed) return;

      // Set texts for this frame
      fillLine(curr, LINES[idx], true);
      fillLine(prev, idx - 1 >= 0 ? LINES[idx - 1] : '', false);
      fillLine(next, idx + 1 < LINES.length ? LINES[idx + 1] : '', false);

      await animateCurrentLineChars(curr);
      if (killed) return;

      await wait(CFG.holdAfterLitMs);
      if (killed) return;

      if (idx === LINES.length - 1) {
        host.classList.add('s5lp-fadeout');
        await wait(560);
        hide();
        running = false;
        return;
      }

      // ✅ Slide up so NEXT becomes visually centered
      setTrackY(-2 * lineH, true);
      await wait(CFG.swipeMs);
      if (killed) return;

      // ✅ KEY FIX: rotate line elements so the centered line stays the new "curr"
      // DOM order was: [prev, curr, next]
      // After sliding up, "next" is in center. We rotate so:
      // new order becomes: [curr, next, prev]
      // then we snap back to -lineH (center) with no flash.
      track.appendChild(prev); // move old prev to bottom
      prev = curr;
      curr = next;
      next = track.lastElementChild; // which is the moved old prev

      // snap back to centered position (no transition)
      setTrackY(-lineH, false);

      // (optional) ensure the new bottom line doesn't momentarily show old text:
      // it will be overwritten at the top of next loop anyway, but you can pre-fill here if you want:
      // fillLine(next, idx + 2 < LINES.length ? LINES[idx + 2] : '', false);
    }

    hide();
    running = false;
  }

  function stopPlayer() {
    killed = true;
    running = false;
    clearAllTimers();
    host.classList.remove('s5lp-fadeout');
    hide();
    track.innerHTML = '';
  }

  window.Section5LyricPlayer = {
    start: () => runPlayer(),
    stop: () => stopPlayer()
  };

  // Auto start/stop by visibility
  let startTimer = null;

  const io = new IntersectionObserver(([entry]) => {
    if (!entry) return;

    if (entry.isIntersecting) {
      if (running) return;
      clearTimeout(startTimer);
      startTimer = setTimeout(() => {
        // don't rely on stale "entry" object
        const nowInView = ROOT.getBoundingClientRect().top < window.innerHeight * 0.65 &&
                          ROOT.getBoundingClientRect().bottom > window.innerHeight * 0.35;
        if (!nowInView) return;
        runPlayer();
      }, CFG.startDelayMs);
    } else {
      clearTimeout(startTimer);
      stopPlayer();
    }
  }, { threshold: 0.35 });

  io.observe(ROOT);
})();
