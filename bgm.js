// bgm.js
(function () {
  const checkbox = document.getElementById('checkboxInput');
  const bgm = document.getElementById('bgm');
  const DESIRED_VOL = 0.45; // default background volume
  let userInteracted = false;

  // tiny fade helper
  function fadeTo(targetVolume = 0, duration = 250) {
    const start = bgm.volume;
    const diff = targetVolume - start;
    const steps = 12;
    const stepTime = Math.max(10, duration / steps);
    let i = 0;
    const t = setInterval(() => {
      i++;
      bgm.volume = Math.max(0, Math.min(1, start + diff * (i / steps)));
      if (i >= steps) clearInterval(t);
    }, stepTime);
  }

  // sync saved preference
  function loadSavedState() {
    const saved = localStorage.getItem('bgmMuted');
    if (saved === '1') checkbox.checked = true;
    else checkbox.checked = false;
  }

  // initial state
  function init() {
    if (!bgm) return console.warn('bgm element not found');
    bgm.volume = 0; // start silent, fade in when playing
    loadSavedState();


  }

  checkbox.addEventListener('change', async () => {
    userInteracted = true;
    // checkbox.checked === true  -> muted state
    if (checkbox.checked) {
      // fade out then pause
      fadeTo(0, 200);
      setTimeout(() => bgm.pause(), 220);
    } else {
      try {
        await bgm.play(); // may throw if blocked
        fadeTo(DESIRED_VOL, 300);
      } catch (err) {
        // blocked by autoplay policy; user must interact again — we'll just log
        console.log('Audio play blocked by browser until user interaction.', err);
      }
    }
    localStorage.setItem('bgmMuted', checkbox.checked ? '1' : '0');
  });

  // A helper you can call from checkPassword() after unlock (since unlock is a user click).
  // e.g. inside your checkPassword success block: if (window.startBgmAfterUnlock) window.startBgmAfterUnlock();
  window.startBgmAfterUnlock = async function () {
    if (!bgm) return;
    // if user didn't mute and audio is paused, try to play (this is allowed because user clicked unlock)
    if (!checkbox.checked && bgm.paused) {
      try {
        await bgm.play();
        fadeTo(DESIRED_VOL, 300);
      } catch (e) {
        console.log('Play failed even after unlock click:', e);
      }
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})();
