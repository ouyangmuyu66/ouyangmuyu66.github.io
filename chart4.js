let chart4 = null;

function renderChart4() {
  /***********************
   * SETTINGS
   ***********************/
  const CSV_URL = './x.csv';
  const PERSON_A = '熙';
  const PERSON_B = 'waifu—蓉蓉ちゃん';

  const YEAR_FILTER = null; // e.g. 2025

  const TYPE49_SUB57_AS = 'file';

  const VISUAL_GAMMA = 0.5;

  // Animation (initial appear)
  const ANIM_DURATION = 1200;
  const ANIM_EASING = 'cubicOut';

  // Radar size
  const RADAR_RADIUS = '60%';

  /***********************
   * RADAR AXES
   ***********************/
  const BUCKETS = [
    { key: 'text',    label: '文本' },
    { key: 'image',   label: '图片' },
    { key: 'video',   label: '视频' },
    { key: 'voice',   label: '语音' },
    { key: 'file',    label: '文件' },
    { key: 'sticker', label: '表情包' }
  ];

  /***********************
   * CHART INIT
   ***********************/
  const dom = document.getElementById('chart4');
  if (!dom) return;

  if (!chart4) {
    chart4 = echarts.init(dom, null, { renderer: 'canvas', useDirtyRect: true });
  }

  window.addEventListener('resize', () => chart4 && chart4.resize());

  function initCounts() {
    const o = { total: 0 };
    for (const b of BUCKETS) o[b.key] = 0;
    return o;
  }

  let counts = new Map([
    [PERSON_A, initCounts()],
    [PERSON_B, initCounts()],
  ]);

  function parseUnixSeconds(sec) {
    const n = Number(sec);
    if (!Number.isFinite(n) || n <= 0) return null;
    return new Date(n * 1000);
  }

  function acceptYear(row) {
    if (!YEAR_FILTER) return true;
    const d = parseUnixSeconds(row.CreateTime);
    return d ? d.getFullYear() === YEAR_FILTER : false;
  }

  function isBracketEmojiText(s) {
    if (!s) return false;
    const t = String(s).trim();
    return /^\[[^\[\]]+\]$/.test(t);
  }

  function getSenderName(row) {
    return (row.Remark || row.NickName || row.Sender || '').toString().trim();
  }

  function bucketFromRow(row) {
    const type = Number(row.Type);
    const sub  = Number(row.SubType);
    const content = (row.StrContent ?? '').toString();

    if (type === 10000) return null;
    if (content.toLowerCase().includes('recalled a message')) return null;

    if (type === 1)  return isBracketEmojiText(content) ? 'sticker' : 'text';
    if (type === 3)  return 'image';
    if (type === 34) return 'voice';
    if (type === 43 || type === 62) return 'video';
    if (type === 47) return 'sticker';

    if (type === 49) {
      if (sub === 57) return TYPE49_SUB57_AS === 'ignore' ? null : TYPE49_SUB57_AS;
      return 'file';
    }

    return 'text';
  }

  function formatInt(n) {
    return (Number(n) || 0).toLocaleString('en-US');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function niceCeil(n) {
    const x = Math.max(1, Math.ceil(n));
    const pow = Math.pow(10, Math.floor(Math.log10(x)));
    const d = x / pow;
    let m = 1;
    if (d <= 1) m = 1;
    else if (d <= 2) m = 2;
    else if (d <= 5) m = 5;
    else m = 10;
    return m * pow;
  }

  function toRawArray(c) {
    return BUCKETS.map(b => Math.floor(c[b.key] || 0));
  }

  function maxRawAcrossAll(rawA, rawB) {
    let mx = 1;
    for (let i = 0; i < BUCKETS.length; i++) {
      mx = Math.max(mx, rawA[i] || 0, rawB[i] || 0);
    }
    return mx;
  }

  function gammaBoost(rawArr, maxRaw, axisMax, gamma) {
    if (maxRaw <= 0) return rawArr.map(() => 0);
    const g = Math.max(0.05, Math.min(1.0, Number(gamma) || 1.0));
    return rawArr.map(v => {
      const x = Math.max(0, Number(v) || 0);
      const norm = x / maxRaw;
      const boosted = Math.pow(norm, g);
      return boosted * axisMax;
    });
  }

  // Galaxy theme colors
  const TEXT_COLOR = 'rgba(240, 235, 255, 0.85)';
  const GRID_COLOR = 'rgba(145, 105, 255, 0.2)';
  const PERSON_A_COLOR = '#56bbff';
  const PERSON_B_COLOR = '#7cff77';

  function render() {
    const a = counts.get(PERSON_A) || initCounts();
    const b = counts.get(PERSON_B) || initCounts();

    const rawA = toRawArray(a);
    const rawB = toRawArray(b);

    const maxRaw = maxRawAcrossAll(rawA, rawB);
    const axisMax = niceCeil(maxRaw * 1.10);

    const visualA = gammaBoost(rawA, maxRaw, axisMax, VISUAL_GAMMA);
    const visualB = gammaBoost(rawB, maxRaw, axisMax, VISUAL_GAMMA);

    const indicator = BUCKETS.map(x => ({ 
      text: x.label, 
      max: axisMax,
      color: TEXT_COLOR
    }));

    chart4.clear();

    chart4.setOption({
      animation: true,
      animationDuration: ANIM_DURATION,
      animationEasing: ANIM_EASING,
      animationDurationUpdate: 400,
      animationEasingUpdate: 'cubicOut',
      backgroundColor: 'transparent',

      title: {
        text: 'WeChat消息类型雷达图',
        left: 'center',
        top: 15,
        textStyle: {
          color: 'rgba(240, 235, 255, 0.95)',
          fontSize: 18,
          fontWeight: 600
        }
      },

      legend: {
        top: 50,
        left: 'center',
        data: [PERSON_A, PERSON_B],
        textStyle: {
          color: TEXT_COLOR,
          fontSize: 13
        }
      },

      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(14, 10, 28, 0.92)',
        borderColor: 'rgba(145, 105, 255, 0.4)',
        borderWidth: 1,
        textStyle: {
          color: TEXT_COLOR
        },
        confine: false,  // ✅ Allow tooltip to extend beyond chart area
        appendToBody: true,  // ✅ Append to body for proper z-index
        position: function (point, params, dom, rect, size) {
          // ✅ Smart positioning: avoid clipping at edges
          return [point[0] + 15, point[1] - 10];
        },
        formatter: (params) => {
          const raw = (params.data && params.data.raw) ? params.data.raw : [];
          let html = `<div style="font-weight:600;margin-bottom:6px">${escapeHtml(params.name)}</div>`;
          for (let i = 0; i < BUCKETS.length; i++) {
            html += `${escapeHtml(BUCKETS[i].label)}&nbsp;&nbsp;<b>${formatInt(raw[i] || 0)}</b><br/>`;
          }
          return html;
        }
      },

      radar: {
        indicator,
        center: ['50%', '58%'],
        radius: RADAR_RADIUS,
        splitNumber: 5,
        name: {
          textStyle: {
            color: TEXT_COLOR,
            fontSize: 12
          }
        },
        splitLine: {
          lineStyle: {
            color: GRID_COLOR,
            type: 'dashed'
          }
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: [
              'rgba(139, 92, 246, 0.03)',
              'rgba(139, 92, 246, 0.06)'
            ]
          }
        },
        axisLine: {
          lineStyle: {
            color: GRID_COLOR
          }
        }
      },

      series: [{
        type: 'radar',
        symbolSize: 6,
        lineStyle: { 
          width: 2.5,
          shadowBlur: 8
        },
        areaStyle: { 
          opacity: 0.25 
        },
        emphasis: {
          lineStyle: {
            width: 3.5,
            shadowBlur: 12
          },
          areaStyle: {
            opacity: 0.4
          }
        },
        data: [
          { 
            name: PERSON_A, 
            value: visualA, 
            raw: rawA,
            lineStyle: {
              color: PERSON_A_COLOR,
              shadowColor: 'rgba(86, 187, 255, 0.5)'
            },
            itemStyle: {
              color: PERSON_A_COLOR,
              borderColor: PERSON_A_COLOR,
              shadowBlur: 8,
              shadowColor: 'rgba(86, 187, 255, 0.5)'
            },
            areaStyle: {
              color: 'rgba(86, 187, 255, 0.2)'
            }
          },
          { 
            name: PERSON_B, 
            value: visualB, 
            raw: rawB,
            lineStyle: {
              color: PERSON_B_COLOR,
              shadowColor: 'rgba(124, 255, 119, 0.5)'
            },
            itemStyle: {
              color: PERSON_B_COLOR,
              borderColor: PERSON_B_COLOR,
              shadowBlur: 8,
              shadowColor: 'rgba(124, 255, 119, 0.5)'
            },
            areaStyle: {
              color: 'rgba(124, 255, 119, 0.2)'
            }
          }
        ]
      }]
    }, { notMerge: true, lazyUpdate: false });
    
    chart4.resize();
  }

  function parseCSVText(csvText) {
    counts = new Map([
      [PERSON_A, initCounts()],
      [PERSON_B, initCounts()],
    ]);

    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      step: (res) => {
        const row = res.data;
        if (!row || row.Type === undefined || row.CreateTime === undefined) return;
        if (!acceptYear(row)) return;

        const sender = getSenderName(row);
        if (sender !== PERSON_A && sender !== PERSON_B) return;

        const bucket = bucketFromRow(row);
        if (!bucket) return;

        const c = counts.get(sender);
        c[bucket] += 1;
        c.total += 1;
      },
      complete: () => render()
    });
  }

  async function loadCSV() {
    const resp = await fetch(CSV_URL, { cache: 'no-store' });
    if (!resp.ok) throw new Error('Failed to load CSV: ' + resp.status);
    const text = await resp.text();
    parseCSVText(text);
  }

  (async function boot() {
    try {
      await loadCSV();
    } catch (e) {
      console.error('Error loading CSV for chart4:', e);
      render();
    }
  })();
}

window.renderChart4 = renderChart4;