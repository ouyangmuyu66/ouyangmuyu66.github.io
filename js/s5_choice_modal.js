/* js/s5_choice_modal.js
   Section 5 Choice Modal — 每行=一页消息 + 支持分支(nextA/nextB) + 支持自定义id(不怕改顺序)
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

  // =========================
  // ✅ 你只需要改这里：台词 + 按钮 + 跳转逻辑
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
    },

    // 【愿意分支】
    yes: [
      {
        id: 'yes_start',
        text: '哎呀呀～我就知道小宝宝一定会愿意的~~（害羞）',
        a: '我确定',
        b: '不，再想想',
        nextA: 'yes_1',
        nextB: 'intro',
      },
      {
        id: 'yes_1',
        text: '肿么办…开心得要洗~ 咳咳 不能暴露小尾巴（严肃）',
        a: '嗯~',
        b: '开玩笑的，我不要，哼',
        nextA: 'yes_2',
        nextB: 'no_start',
      },
      { id: 'yes_2', text: '我不逼你啦，我只想你开心。' },
      { id: 'yes_3', text: '不舍得看我大冬天在老婆门外跪搓衣板，是不是？' },
      { id: 'yes_4', text: '我嘞个豆？~' },
      { id: 'yes_5', text: '我爱你老婆~ 嘻嘻~(^^)' },
      { id: 'yes_end', text: '那就说好了哦：我们要一直一直在一起。' },
    ],

    // 【不愿意分支】
    no: [
      {
        id: 'no_start',
        text: 'Oi？！竟然说不愿意？！！！',
        a: '我开玩笑的啦',
        b: '就不愿意',
        nextA: 'yes_start',
        nextB: 'no_who',
      },

      // ✅ 关键：这一页点不同按钮走不同剧情
      {
        id: 'no_who',
        text: '那你要嫁给谁？？',
        a: '当然是你',
        b: '带你走',
        // A：走“甜一下”的路
        nextA: 'no_sweet',
        // B：直接跳去“跟我走吧~”那段（不经过吃醋）
        nextB: 'no_demon',
      },

      // A路：甜一下，然后再进入主线
      {
        id: 'no_sweet',
        text: '哼…这还差不多~（得意）',
        a: '继续说',
        b: '亲一下再说',
        nextA: 'no_main0',
        nextB: 'no_main0',
      },

      // 另一条“逗我”路线：如果你想要“吃醋”只在某些选项出现，把它放成单独页面
      {
        id: 'no_jealous',
        text: '……我吃醋了。',
        a: '哄哄你',
        b: '继续逗你',
        nextA: 'no_main0',
        nextB: 'no_main0',
      },

      // 主线开始（你也可以从别的页面跳到这里）
      { id: 'no_main0', text: '可恶，不行！绝对不行！！！' },
      { id: 'no_main1', text: '你只能是我的。' },

      // 你希望“带你走”点了不出现“我吃醋了”，那就把“带你走”直接跳到这里
      { id: 'no_demon', text: '带我走吧~ 我是恶魔你就是天使，我们一定能好好相处的~' },

      { id: 'no_main2', text: '嗯~ 不要嘛~' },
      { id: 'no_main3', text: '好吧...' },
      { id: 'no_main4', text: '骗你哒~ 哪儿有放老婆走的道理~' },
      { id: 'no_main5', text: '就要 就要你跟我走。' },
      { id: 'no_main6', text: '哼！要是不跟我走你惨啦！粘着你不走~天天让你背着我上学，哼哼哼~' },
      { id: 'no_main7', text: '爱你 爱你 么么哒~' },
      { id: 'no_end',  text: '行！明天我们就去登记吧~' },
    ],
  };

  // =========================
  // 按钮默认文案（你刚刚想改的就是这里）
  // =========================
  const DEFAULT_BTN = { a: '嗯嗯', b: '我还想听~' };
  const END_BTN     = { a: '抱抱收尾', b: '亲亲再关' };

  // =========================
  // 下面是引擎（一般不用改）
  // =========================
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

    // intro
    const introId = CONTENT.intro.id || 'intro';
    PAGES[introId] = {
      id: introId,
      text: CONTENT.intro.text,
      a: CONTENT.intro.a,
      b: CONTENT.intro.b,
      nextA: CONTENT.intro.nextA,
      nextB: CONTENT.intro.nextB,
    };

    // yes
    CONTENT.yes.forEach((p, i) => {
      const id = p.id || `yes_${i}`;
      const last = i === CONTENT.yes.length - 1;

      PAGES[id] = {
        id,
        text: p.text,
        a: p.a ?? (last ? END_BTN.a : DEFAULT_BTN.a),
        b: p.b ?? (last ? END_BTN.b : DEFAULT_BTN.b),

        // 如果没写 nextA/nextB，就默认“下一页”
        nextA: p.nextA ?? (last ? 'close' : nextIdOf(CONTENT.yes, i, 'yes')),
        nextB: p.nextB ?? (last ? 'close' : nextIdOf(CONTENT.yes, i, 'yes')),
      };
    });

    // no
    CONTENT.no.forEach((p, i) => {
      const id = p.id || `no_${i}`;
      const last = i === CONTENT.no.length - 1;

      PAGES[id] = {
        id,
        text: p.text,
        a: p.a ?? (last ? END_BTN.a : DEFAULT_BTN.a),
        b: p.b ?? (last ? END_BTN.b : DEFAULT_BTN.b),
        nextA: p.nextA ?? (last ? 'close' : nextIdOf(CONTENT.no, i, 'no')),
        nextB: p.nextB ?? (last ? 'close' : nextIdOf(CONTENT.no, i, 'no')),
      };
    });
  }

  function render() {
    const p = PAGES[currentId] || PAGES.intro;
    body.textContent = p.text ?? '';
    btnA.textContent = p.a ?? DEFAULT_BTN.a;
    btnB.textContent = p.b ?? DEFAULT_BTN.b;
    btnA.disabled = !!p.disableA;
    btnB.disabled = !!p.disableB;
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
    goto(nxt || 'close');
  }

  btnA.addEventListener('click', () => click('A'));
  btnB.addEventListener('click', () => click('B'));

  // title/sub
  if (titleEl && typeof CONTENT.title === 'string') titleEl.textContent = CONTENT.title;
  if (subEl && typeof CONTENT.sub === 'string') subEl.textContent = CONTENT.sub;

  // init
  buildPages();

  window.Section5ChoiceModal = {
    open: () => { currentId = CONTENT.intro.id || 'intro'; show(); },
    close: () => hide(),
    goto,
    rebuild: () => { buildPages(); render(); },
    getState: () => ({ isOpen, currentId }),
  };
})();
