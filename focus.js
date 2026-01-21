/* ---------- CONFIG (change these to control timing) ---------- */
const AUTO_DELAY_MS = 1000;        // wait before auto focus triggers
const AUTO_BUBBLE_CLOSE_MS = 3000; // bubble/dots hide time (auto)
const AUTO_HOLD_MS = 2500;         // avatar focus total time (auto)

const MANUAL_BUBBLE_CLOSE_MS = 1800; // bubble/dots hide time (manual click)
const MANUAL_HOLD_MS = 2500;         // avatar focus total time (manual click)

/* ---------- INTERNAL STATE ---------- */
let manualTimers = new WeakMap(); // per-avatar timers (bubble close + unfocus)
let _cleanupAvatarFocus = null;   // auto sequence cleanup hook (optional)

/* ---------- helpers: bubble show/hide ---------- */
function setBubbleActive(avatarEl, on) {
  if (!avatarEl) return;
  avatarEl.querySelectorAll('.thinking-bubble').forEach(b => {
    b.classList.toggle('active', !!on);
  });
}

/* ---------- Focus mode sync (row marker + overlay click to exit) ---------- */
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

  // mark row containing focused avatar
  const row = focusedAvatar.closest('.message-row');
  if (row) row.classList.add('is-focus-row');

  // bind overlay click once
  if (overlay && !overlay.__boundClose) {
    overlay.__boundClose = true;
    overlay.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll('.avatar.is-focus').forEach(a => unfocusAvatar(a));
    });
  }
}

/* ---------- portal move: keep row at exact screen position ---------- */
function moveRowToTop(row, toTop) {
  const top = document.getElementById('focus-top');
  if (!row || !top) return;

  if (toTop) {
    if (row.__inTop) return;

    // capture screen position BEFORE moving
    const rect = row.getBoundingClientRect();

    // remember original home
    row.__home = row.parentNode;
    row.__next = row.nextSibling;

    // move to top layer
    top.appendChild(row);
    row.__inTop = true;

    // pin it to the same spot
    row.style.position = 'fixed';
    row.style.left = rect.left + 'px';
    row.style.top = rect.top + 'px';
    row.style.width = rect.width + 'px';
    row.style.margin = '0';
    row.style.zIndex = '10002';
  } else {
    if (!row.__inTop) return;

    // clear pin styles
    row.style.position = '';
    row.style.left = '';
    row.style.top = '';
    row.style.width = '';
    row.style.margin = '';
    row.style.zIndex = '';

    // move back
    if (row.__home) row.__home.insertBefore(row, row.__next);

    row.__home = null;
    row.__next = null;
    row.__inTop = false;
  }
}

/* ---------- cancel per-avatar timers ---------- */
function clearManualTimers(avatarEl) {
  const t = manualTimers.get(avatarEl);
  if (!t) return;
  if (t.bubbleTimer) clearTimeout(t.bubbleTimer);
  if (t.unfocusTimer) clearTimeout(t.unfocusTimer);
  manualTimers.delete(avatarEl);
}

/* ---------- focus / unfocus primitives ---------- */
function focusAvatar(avatarEl, bubbleCloseMs, holdMs) {
  const row = avatarEl.closest('.message-row');

  // ensure only one focus at a time (recommended)
  document.querySelectorAll('.avatar.is-focus').forEach(a => {
    if (a !== avatarEl) unfocusAvatar(a);
  });

  document.body.classList.add('focus-mode');
  if (row) row.classList.add('is-focus-row');

  avatarEl.classList.add('is-focus');

  // show bubble (dots + bubble are tied to .active in your CSS)
  setBubbleActive(avatarEl, true);

  // escape stacking context AND keep position
  moveRowToTop(row, true);

  // schedule bubble close + full close
  clearManualTimers(avatarEl);

  const bubbleTimer = setTimeout(() => {
    // hide bubble earlier if you want
    setBubbleActive(avatarEl, false);
  }, bubbleCloseMs);

  const unfocusTimer = setTimeout(() => {
    unfocusAvatar(avatarEl);
  }, holdMs);

  manualTimers.set(avatarEl, { bubbleTimer, unfocusTimer });

  updateFocusMode();
}

function unfocusAvatar(avatarEl) {
  if (!avatarEl) return;

  clearManualTimers(avatarEl);

  const row = avatarEl.closest('.message-row');

  // hide bubble immediately (prevents “pop once again”)
  setBubbleActive(avatarEl, false);

  avatarEl.classList.remove('is-focus');
  if (row) row.classList.remove('is-focus-row');

  moveRowToTop(row, false);

  // only turn off focus-mode if none focused
  if (!document.querySelector('.avatar.is-focus')) {
    document.body.classList.remove('focus-mode');
  }

  updateFocusMode();
}

/* ---------- MANUAL CLICK ---------- */
function toggleAvatarFocus(el) {
  // stop auto sequence if running
  if (window._cleanupAvatarFocus) window._cleanupAvatarFocus();

  const willFocus = !el.classList.contains('is-focus');

  if (willFocus) {
    focusAvatar(el, MANUAL_BUBBLE_CLOSE_MS, MANUAL_HOLD_MS);
  } else {
    unfocusAvatar(el);
  }
}

/* ---------- AUTO SEQUENCE (IntersectionObserver) ---------- */
window.initAvatarFocus = function initAvatarFocus() {
  const CENTER_ROOT_MARGIN = '-35% 0px 200px 0px';

  // only avatar containers that have avatar-base or avatar-focus
  const allAvatars = Array.from(document.querySelectorAll('.avatar')).filter(av =>
    av.querySelector && (av.querySelector('.avatar-base') || av.querySelector('.avatar-focus'))
  );

  if (!allAvatars.length) return;

  const queue = [];
  let isAnimating = false;
  const timers = new WeakMap();
  let io = null;

  allAvatars.forEach(av => timers.set(av, { inTimer: null, holdTimer: null, bubbleTimer: null }));

  function cleanup() {
    if (io) {
      try { io.disconnect(); } catch(e){}
      io = null;
    }
    allAvatars.forEach(av => {
      const obj = timers.get(av);
      if (!obj) return;
      if (obj.inTimer) clearTimeout(obj.inTimer);
      if (obj.holdTimer) clearTimeout(obj.holdTimer);
      if (obj.bubbleTimer) clearTimeout(obj.bubbleTimer);
      timers.set(av, { inTimer: null, holdTimer: null, bubbleTimer: null });
    });
    queue.length = 0;
    isAnimating = false;
  }

  cleanup();
  window._cleanupAvatarFocus = cleanup;

  io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const av = entry.target;
      const obj = timers.get(av) || { inTimer: null, holdTimer: null, bubbleTimer: null };

      if (entry.isIntersecting) {
        if (!queue.includes(av)) queue.push(av);
        scheduleQueue();
      } else {
        // cancel pre-focus delay if it leaves center before starting
        if (obj.inTimer) {
          clearTimeout(obj.inTimer);
          obj.inTimer = null;
        }
        timers.set(av, obj);
      }
    });
  }, { root: null, rootMargin: CENTER_ROOT_MARGIN, threshold: 0.5 });

  allAvatars.forEach(av => io.observe(av));

  function scheduleQueue() {
    if (isAnimating) return;
    if (!queue.length) return;

    const next = queue.shift();
    const obj = timers.get(next);

    isAnimating = true;

    if (obj.inTimer) { clearTimeout(obj.inTimer); obj.inTimer = null; }
    if (obj.holdTimer) { clearTimeout(obj.holdTimer); obj.holdTimer = null; }
    if (obj.bubbleTimer) { clearTimeout(obj.bubbleTimer); obj.bubbleTimer = null; }

    obj.inTimer = setTimeout(() => {
      obj.inTimer = null;

      if (!document.body.contains(next)) {
        isAnimating = false;
        scheduleQueue();
        return;
      }

      // focus ON (auto)
      focusAvatar(next, AUTO_BUBBLE_CLOSE_MS, AUTO_HOLD_MS);

      // When the auto hold ends, focusAvatar will call unfocusAvatar via timer.
      // We just need to release the queue lock after AUTO_HOLD_MS.
      obj.holdTimer = setTimeout(() => {
        obj.holdTimer = null;
        isAnimating = false;
        scheduleQueue();
      }, AUTO_HOLD_MS);

    }, AUTO_DELAY_MS);

    timers.set(next, obj);
  }
};

/* ---------- overlay binding safety (if you want) ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Ensure overlay exists; updateFocusMode will bind click too
  updateFocusMode();
});

/* Expose manual toggle to HTML onclick usage */
window.toggleAvatarFocus = toggleAvatarFocus;