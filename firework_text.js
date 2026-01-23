/* js/s5_lyric_player.js
   SECTION 5 lyric player — hard-freeze + auto-start after modal resume
   Events: s5:pause / s5:resume
*/
;(() => {
  'use strict';

  const ROOT = document.querySelector('#section5');
  if (!ROOT) return;

  const host = ROOT.querySelector('#s5-lyric-player');
  if (!host) return;

  const track = host.querySelector('.s5lp-track');
  if (!track) return;

  // Inject paused CSS once (covers newly-created spans)
  (function ensurePausedCSS(){
    if (document.getElementById('s5lp-paused-style')) return;
    const st = document.createElement('style');
    st.id = 's5lp-paused-style';
    st.textContent = `
#s5-lyric-player.s5lp-paused, 
#s5-lyric-player.s5lp-paused *{
  animation-play-state: paused !important;
  transition: none !important;
}`;
    document.head.appendChild(st);
  })();

  const CFG = {
    startDelayMs: 20,

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

  function show(){ host.style.display = 'block'; }
  function hide(){ host.style.display = 'none'; }

  function splitToChars(t){ return Array.from(t); }

  function makeLine(text, cls){
    const el = document.createElement('div');
    el.className = `s5lp-line ${cls || ''}`.trim();

    const safeText = (text && String(text).length) ? String(text) : ' ';
    const chars = splitToChars(safeText);

    for (const ch of chars){
      const span = document.createElement('span');
      span.className = 's5lp-char';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      el.appendChild(span);
    }

    if (!text || !String(text).length) el.classList.add('is-placeholder');
    return el;
  }

  function fillLine(el, text, makeCurrent){
    el.classList.remove('is-current', 'is-dim', 'is-placeholder');
    el.classList.add(makeCurrent ? 'is-current' : 'is-dim');

    el.innerHTML = '';
    const safeText = (text && String(text).length) ? String(text) : ' ';
    const chars = splitToChars(safeText);

    for (const ch of chars){
      const span = document.createElement('span');
      span.className = 's5lp-char';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      el.appendChild(span);
    }

    if (!text || !String(text).length) el.classList.add('is-placeholder');
  }

  let trackY = 0;
  function setTrackY(px){
    trackY = px;
    track.style.transform = `translate3d(0, ${px}px, 0)`;
  }

  function setFrozenUI(on){
    host.classList.toggle('s5lp-paused', !!on);
  }

  function inView(){
    const r = ROOT.getBoundingClientRect();
    return r.top < window.innerHeight * 0.65 && r.bottom > window.innerHeight * 0.35;
  }

  // =========================
  // State machine (RAF-driven)
  // =========================
  let running = false;
  let killed = false;
  let frozen = false;

  let prevEl, currEl, nextEl;
  let lineH = 56;
  let idx = 0;

  let phase = 'IDLE';
  let phaseT = 0;
  let phaseDur = 0;
  let swipeFrom = 0;
  let swipeTo = 0;

  let rafId = 0;
  let lastTs = 0;

  function gotoPhase(next, dur=0){
    phase = next;
    phaseT = 0;
    phaseDur = Math.max(0, dur|0);
  }

  function stopPlayer(){
    killed = true;
    running = false;
    phase = 'IDLE';
    phaseT = 0;
    phaseDur = 0;
    idx = 0;

    cancelAnimationFrame(rafId);
    rafId = 0;

    host.classList.remove('s5lp-fadeout');
    track.innerHTML = '';
    hide();
  }

  function buildLayout(){
    track.innerHTML = '';
    track.style.opacity = '1';
    host.classList.remove('s5lp-fadeout');
    show();

    prevEl = makeLine('', 'is-dim');
    currEl = makeLine(LINES[0] ?? '', 'is-current');
    nextEl = makeLine(LINES[1] ?? '', 'is-dim');

    track.appendChild(prevEl);
    track.appendChild(currEl);
    track.appendChild(nextEl);

    const rect = currEl.getBoundingClientRect();
    lineH = Math.max(44, rect.height || 0) + CFG.lineGapPx;

    setTrackY(-lineH);
  }

  function setupCharAnim(currentEl){
    const spans = Array.from(currentEl.querySelectorAll('.s5lp-char'));
    if (!spans.length) return 0;

    if (reduceMotion){
      for (const s of spans){
        s.style.animation = 'none';
        s.style.color = '#fff';
        s.style.textShadow =
          '0 0 10px rgba(255,120,210,0.85), 0 0 24px rgba(255,120,210,0.55), 0 0 44px rgba(255,120,210,0.25)';
      }
      return 0;
    }

    spans.forEach((s, i) => {
      s.style.animation = 'none';
      s.style.animationDelay = '0ms';
      s.offsetHeight;
      s.style.animation = `s5lp-charLight ${CFG.charAnimMs}ms ease forwards`;
      s.style.animationDelay = `${i * CFG.perCharDelayMs}ms`;
    });

    return (spans.length - 1) * CFG.perCharDelayMs + CFG.charAnimMs;
  }

  function tick(ts){
    rafId = requestAnimationFrame(tick);
    if (!running || killed) return;

    if (!lastTs) lastTs = ts;
    let dt = ts - lastTs;
    lastTs = ts;

    if (frozen) dt = 0;

    phaseT += dt;
    if (phaseT > 600000) phaseT = 600000;

    switch (phase){
      case 'START_DELAY': {
        if (phaseT >= CFG.startDelayMs) gotoPhase('CHAR_SETUP', 0);
        break;
      }

      case 'CHAR_SETUP': {
        if (!LINES || !LINES.length) { stopPlayer(); break; }

        fillLine(currEl, LINES[idx] ?? '', true);
        fillLine(prevEl, idx - 1 >= 0 ? (LINES[idx - 1] ?? '') : '', false);
        fillLine(nextEl, idx + 1 < LINES.length ? (LINES[idx + 1] ?? '') : '', false);

        const animTotal = setupCharAnim(currEl);
        gotoPhase('CHAR_ANIM', animTotal);
        break;
      }

      case 'CHAR_ANIM': {
        if (phaseT >= phaseDur) gotoPhase('HOLD', CFG.holdAfterLitMs);
        break;
      }

      case 'HOLD': {
        if (phaseT >= phaseDur){
          if (idx >= LINES.length - 1){
            host.classList.add('s5lp-fadeout');
            gotoPhase('FADEOUT', 560);
          } else {
            swipeFrom = -lineH;
            swipeTo = -2 * lineH;
            gotoPhase('SWIPE', CFG.swipeMs);
          }
        }
        break;
      }

      case 'SWIPE': {
        const t = phaseDur ? Math.min(1, phaseT / phaseDur) : 1;
        const e = t * t * (3 - 2 * t);
        setTrackY(swipeFrom + (swipeTo - swipeFrom) * e);

        if (t >= 1){
          track.appendChild(prevEl);
          prevEl = currEl;
          currEl = nextEl;
          nextEl = track.lastElementChild;

          setTrackY(-lineH);

          idx++;
          gotoPhase('CHAR_SETUP', 0);
        }
        break;
      }

      case 'FADEOUT': {
        if (phaseT >= phaseDur){
          hide();
          running = false;
          gotoPhase('IDLE', 0);
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        break;
      }

      default:
        break;
    }
  }

  function startWithDelay(){
    if (running) return;
    if (!LINES || !LINES.length) return;
    if (!inView()) return;

    killed = false;
    running = true;

    buildLayout();
    idx = 0;

    gotoPhase('START_DELAY', CFG.startDelayMs);

    lastTs = 0;
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }

  function startImmediate(){
    if (running) return;
    if (!LINES || !LINES.length) return;
    if (!inView()) return;

    killed = false;
    running = true;

    buildLayout();
    idx = 0;

    gotoPhase('CHAR_SETUP', 0);

    lastTs = 0;
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }

  // =========================
  // Public API
  // =========================
  window.Section5LyricPlayer = {
    start: () => startImmediate(),
    startWithDelay: () => startWithDelay(),
    stop: () => stopPlayer(),
    freeze: () => { frozen = true; setFrozenUI(true); },
    resume: () => { frozen = false; setFrozenUI(false); },
    isRunning: () => running,
  };

  // =========================
  // Freeze hooks
  // =========================
  function onPause(){
    frozen = true;
    setFrozenUI(true);
  }
  function onResume(){
    frozen = false;
    setFrozenUI(false);
    if (!running && inView()) startWithDelay();
  }

  window.addEventListener('s5:pause', onPause);
  window.addEventListener('s5:resume', onResume);
  // If section5 is already frozen when this script runs, apply freeze immediately
  if (window.__S5_FROZEN__) onPause();

  // Optional global flag support
  setInterval(() => {
    if (window.__S5_FROZEN__ && !frozen) onPause();
    if (!window.__S5_FROZEN__ && frozen) onResume();
  }, 200);

  // =========================
  // Auto start/stop by visibility
  // =========================
  const io = new IntersectionObserver(([entry]) => {
    if (!entry) return;
    if (entry.isIntersecting){
      if (frozen || window.__S5_FROZEN__) return;
      startWithDelay();
    } else {
      stopPlayer();
    }
  }, { threshold: 0.35 });

  io.observe(ROOT);
})();
