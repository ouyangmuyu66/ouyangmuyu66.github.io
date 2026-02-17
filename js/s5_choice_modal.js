/* js/s5_choice_modal.js
   Section 5 Choice Modal — Enhanced with FLEXIBLE animation + image combinations
*/
(() => {
  'use strict';

  const ROOT = document.querySelector('#section5');
  if (!ROOT) return;

  const overlay = ROOT.querySelector('#s5-choice-overlay');
  const body    = ROOT.querySelector('#s5c-body');
  const btnA    = ROOT.querySelector('#s5c-btnA');
  const btnB    = ROOT.querySelector('#s5c-btnB');

  if (!overlay || !body || !btnA || !btnB) return;

  const card     = overlay.querySelector('.s5c-card');
  const backdrop = overlay.querySelector('.s5c-backdrop');
  const titleEl  = overlay.querySelector('.s5c-title');
  const subEl    = overlay.querySelector('.s5c-sub');

  const imageContainer = document.createElement('div');
  imageContainer.className = 's5c-image-container';
  imageContainer.innerHTML = '<img class="s5c-reaction-image" alt="Reaction" />';
  body.parentElement.insertBefore(imageContainer, body);

  const reactionImg = imageContainer.querySelector('.s5c-reaction-image');

  // =========================
  // ✅ FLEXIBLE: Now you can use ANY animation with ANY image!
  // Just specify both properties separately
  // =========================
  const CONTENT = {
    title: '小宝宝',
    sub: '先回答我一个问题…',

    intro: {
      id: 'intro',
      text: '你愿意嫁给我吗？',
      a: '我愿意',
      b: '我不愿意',
      nextA: 'yes_start',
      nextB: 'no_start',
      animationA: 'celebration',
      animationB: 'shake',
    },

    yes: [
      {
        id: 'yes_start',
        text: '哎呀呀～我就知道小宝宝一定会愿意的~~（害羞）',
        a: '我确定',
        b: '不，再想想',
        nextA: 'yes_1',
        nextB: 'intro',
        animationA: 'heartbeat',
        animationB: 'shake',
      },
      {
        id: 'yes_1',
        text: '肿么办…开心得要洗~ 咳咳 不能暴露小尾巴（严肃）',
        a: '嗯~',
        b: '开玩笑的，我不要，哼',
        nextA: 'yes_2',
        nextB: 'no_start',
        animationA: 'gentle',
        animationB: 'dramatic-shake',
      },
      { id: 'yes_2', text: '我不逼你啦，我只想你开心。', animationA: 'gentle' },
      { id: 'yes_3', text: '不舍得看我大冬天在老婆门外跪搓衣板，是不是？', animationA: 'gentle' },
      { id: 'yes_4', text: '我嘞个豆？~', animationA: 'bounce' },
      { id: 'yes_5', text: '我爱你老婆~ 嘻嘻~(^^)', animationA: 'heartbeat' },
      { id: 'yes_end', text: '那就说好了哦：我们要一直一直在一起。', animationA: 'celebration', animationB: 'celebration' },
    ],

    no: [
      {
        id: 'no_start',
        text: 'Oi？！竟然说不愿意？！！！',
        a: '我开玩笑的啦',
        b: '就不愿意',
        nextA: 'yes_start',
        nextB: 'no_who',
        animationA: 'heartbeat',
        animationB: 'dramatic-shake',
      },
      {
        id: 'no_who',
        text: '那你要嫁给谁？？',
        a: '当然是你',
        b: '带你走',
        nextA: 'no_sweet',
        nextB: 'no_demon',
        animationA: 'heartbeat',
        animationB: 'gentle',
      },
      {
        id: 'no_sweet',
        text: '哼…这还差不多~（得意）',
        a: '骗你的 就不~',
        b: '亲一下再说',
        nextA: 'no_main0',
        nextB: 'no_main1',
        animationA: 'shake',
        animationB: 'heartbeat',
      },
      {
        id: 'no_jealous',
        text: '……我吃醋了。',
        a: '哄哄你',
        b: '继续逗你',
        nextA: 'no_main0',
        nextB: 'no_main0',
        animationA: 'gentle',
        animationB: 'shake',
      },
      // ✅ EXAMPLE: Shake animation + show image at the same time
      { 
        id: 'no_main0', 
        text: '可恶，不行！绝对不行！！！', 
        image: 'images/shouzhe.PNG',  // Image shows
        animationA: 'shake'             // Card shakes
      },
      // ✅ EXAMPLE: Heartbeat animation + show image
      { 
        id: 'no_main1', 
        text: '你只能是我的。',
        image: 'images/shouzhe.PNG',  // Same image
        animationA: 'heartbeat'        // But different animation!
      },
      { id: 'no_demon', text: '带我走吧~ 我是恶魔你就是天使，我们一定能好好相处的~', animationA: 'gentle' },
      { id: 'no_main2', text: '嗯~ 不要嘛~', animationA: 'bounce' },
      { id: 'no_main3', text: '好吧...', animationA: 'gentle' },
      { id: 'no_main4', text: '骗你哒~ 哪儿有放老婆走的道理~', animationA: 'bounce' },
      { id: 'no_main5', text: '就要 就要你跟我走。', animationA: 'heartbeat' },
      { id: 'no_main6', text: '哼！要是不跟我走你惨啦！粘着你不走~天天让你背着我上学，哼哼哼~', animationA: 'bounce' },
      { id: 'no_main7', text: '爱你 爱你 么么哒~', animationA: 'heartbeat' },
      { id: 'no_end',  text: '行！明天我们就去登记吧~', animationA: 'celebration', animationB: 'celebration' },
    ],
  };

  const DEFAULT_BTN = { a: '嗯呐呐', b: '我还想听~' };
  const END_BTN     = { a: '抱抱收尾', b: '亲亲再关' };

  const ANIMATIONS = {
    celebration: () => {
      card.style.animation = 'none';
      void card.offsetWidth;
      card.style.animation = 's5c-celebrate 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)';  // ✅ Slower: 0.6s → 1.2s
      createConfetti();
    },
    shake: () => {
      card.style.animation = 'none';
      void card.offsetWidth;
      card.style.animation = 's5c-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)';
    },
    'dramatic-shake': () => {
      card.style.animation = 'none';
      void card.offsetWidth;
      card.style.animation = 's5c-dramatic-shake 0.7s cubic-bezier(0.36, 0.07, 0.19, 0.97)';
      backdrop.style.animation = 's5c-backdrop-pulse 0.7s ease-out';
    },
    heartbeat: () => {
      card.style.animation = 'none';
      void card.offsetWidth;
      card.style.animation = 's5c-heartbeat 0.8s ease-in-out';
      createHearts();
    },
    bounce: () => {
      card.style.animation = 'none';
      void card.offsetWidth;
      card.style.animation = 's5c-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    },
    gentle: () => {
      card.style.animation = 'none';
      void card.offsetWidth;
      card.style.animation = 's5c-gentle 0.5s ease-out';
    },
  };

  function createConfetti() {
    const colors = ['#ff6b9d', '#c368ff', '#68ddff', '#ffd368', '#68ff9d'];
    // ✅ More confetti: 30 → 60 pieces
    for (let i = 0; i < 60; i++) {
      const confetti = document.createElement('div');
      confetti.className = 's5c-confetti';
      confetti.style.left = Math.random() * 100 + '%';  // ✅ Spread across full width
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 0.5 + 's';  // ✅ Staggered start
      confetti.style.animationDuration = (Math.random() * 1.5 + 2) + 's';  // ✅ Slower fall: 2-3.5s
      document.body.appendChild(confetti);  // ✅ Append to body to fill whole screen
      setTimeout(() => confetti.remove(), 4000);  // ✅ Clean up after 4s
    }
  }

  function createHearts() {
    for (let i = 0; i < 8; i++) {
      const heart = document.createElement('div');
      heart.className = 's5c-heart';
      heart.textContent = '♥';
      heart.style.left = (Math.random() * 80 + 10) + '%';
      heart.style.animationDelay = Math.random() * 0.3 + 's';
      heart.style.fontSize = (Math.random() * 10 + 20) + 'px';
      overlay.appendChild(heart);
      setTimeout(() => heart.remove(), 2000);
    }
  }

  function animateButton(btn, isPositive) {
    btn.style.animation = 'none';
    void btn.offsetWidth;
    if (isPositive) {
      btn.style.animation = 's5c-btn-yes 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    } else {
      btn.style.animation = 's5c-btn-no 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97)';
    }
  }

  let PAGES = Object.create(null);
  let currentId = 'intro';
  let isOpen = !overlay.classList.contains('is-hidden');

  function nextIdOf(arr, i, fallbackPrefix) {
    const n = arr[i + 1];
    if (!n) return 'close';
    return n.id || `${fallbackPrefix}_${i + 1}`;
  }

  function buildPages() {
    PAGES = Object.create(null);
    const introId = CONTENT.intro.id || 'intro';
    PAGES[introId] = {
      id: introId,
      text: CONTENT.intro.text,
      a: CONTENT.intro.a,
      b: CONTENT.intro.b,
      nextA: CONTENT.intro.nextA,
      nextB: CONTENT.intro.nextB,
      animationA: CONTENT.intro.animationA,
      animationB: CONTENT.intro.animationB,
      image: CONTENT.intro.image,
    };

    CONTENT.yes.forEach((p, i) => {
      const id = p.id || `yes_${i}`;
      const last = i === CONTENT.yes.length - 1;
      PAGES[id] = {
        id, text: p.text,
        a: p.a ?? (last ? END_BTN.a : DEFAULT_BTN.a),
        b: p.b ?? (last ? END_BTN.b : DEFAULT_BTN.b),
        nextA: p.nextA ?? (last ? 'close' : nextIdOf(CONTENT.yes, i, 'yes')),
        nextB: p.nextB ?? (last ? 'close' : nextIdOf(CONTENT.yes, i, 'yes')),
        animationA: p.animationA, animationB: p.animationB, image: p.image,
      };
    });

    CONTENT.no.forEach((p, i) => {
      const id = p.id || `no_${i}`;
      const last = i === CONTENT.no.length - 1;
      PAGES[id] = {
        id, text: p.text,
        a: p.a ?? (last ? END_BTN.a : DEFAULT_BTN.a),
        b: p.b ?? (last ? END_BTN.b : DEFAULT_BTN.b),
        nextA: p.nextA ?? (last ? 'close' : nextIdOf(CONTENT.no, i, 'no')),
        nextB: p.nextB ?? (last ? 'close' : nextIdOf(CONTENT.no, i, 'no')),
        animationA: p.animationA, animationB: p.animationB, image: p.image,
      };
    });
  }

  function render() {
    const p = PAGES[currentId] || PAGES.intro;
    body.style.opacity = '0';
    setTimeout(() => {
      body.textContent = p.text ?? '';
      body.style.opacity = '1';
    }, 150);
    btnA.textContent = p.a ?? DEFAULT_BTN.a;
    btnB.textContent = p.b ?? DEFAULT_BTN.b;
    btnA.disabled = !!p.disableA;
    btnB.disabled = !!p.disableB;
    
    // ✅ Image shows/hides independently of animation
    if (p.image) {
      reactionImg.src = p.image;
      imageContainer.classList.add('is-visible');
    } else {
      imageContainer.classList.remove('is-visible');
    }
  }

  function show() {
    overlay.classList.remove('is-hidden', 'is-closing');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    isOpen = true;
    render();
  }

  function hide() {
    if (!isOpen) return;
    overlay.classList.add('is-closing');
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    let done = false;
    const finalize = () => {
      if (done) return;
      done = true;
      overlay.classList.add('is-hidden');
      overlay.classList.remove('is-closing');
      overlay.removeEventListener('transitionend', onEnd, true);
      overlay.removeEventListener('animationend', onEnd, true);
      clearTimeout(fallback);
      isOpen = false;
      imageContainer.classList.remove('is-visible');
    };
    const onEnd = (e) => {
      if (e.target === card || e.target === backdrop) finalize();
    };
    overlay.addEventListener('transitionend', onEnd, true);
    overlay.addEventListener('animationend', onEnd, true);
    const fallback = setTimeout(finalize, 900);
  }

  function goto(id) {
    if (id === 'close') return hide();
    if (PAGES[id]) currentId = id;
    render();
  }

  function click(which) {
    const p = PAGES[currentId] || {};
    const nxt = which === 'A' ? p.nextA : p.nextB;
    const anim = which === 'A' ? p.animationA : p.animationB;
    const btn = which === 'A' ? btnA : btnB;
    const isPositive = (which === 'A' && p.a?.includes('愿意')) || 
                       (which === 'A' && p.a?.includes('确定')) ||
                       (which === 'A' && p.a?.includes('当然')) ||
                       (which === 'B' && p.b?.includes('亲'));
    
    // ✅ AUTO-TRIGGER CELEBRATION: When clicking final buttons OR when animation is 'celebration'
    const isFinalPage = nxt === 'close';
    const shouldCelebrate = anim === 'celebration' || isFinalPage;
    
    if (shouldCelebrate) {
      ANIMATIONS.celebration();  // ✅ IMMEDIATE celebration
      animateButton(btn, true);
    } else {
      animateButton(btn, isPositive);
    }
    
    // ✅ Other animations and page transition
    setTimeout(() => {
      if (anim && anim !== 'celebration' && !isFinalPage && ANIMATIONS[anim]) {
        ANIMATIONS[anim]();
      }
      goto(nxt || 'close');
    }, shouldCelebrate ? 0 : 150);
  }

  btnA.addEventListener('click', () => click('A'));
  btnB.addEventListener('click', () => click('B'));

  if (titleEl && typeof CONTENT.title === 'string') titleEl.textContent = CONTENT.title;
  if (subEl && typeof CONTENT.sub === 'string') subEl.textContent = CONTENT.sub;

  buildPages();

  window.Section5ChoiceModal = {
    open: () => { currentId = CONTENT.intro.id || 'intro'; show(); },
    close: () => hide(),
    goto,
    rebuild: () => { buildPages(); render(); },
    getState: () => ({ isOpen, currentId }),
  };
})();