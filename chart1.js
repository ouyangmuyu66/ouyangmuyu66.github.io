let msgChart = null;

// ✅ Responsive scaling functions
function getResponsiveFontSize(baseSize) {
  const width = window.innerWidth;
  if (width < 480) return Math.round(baseSize * 0.75);
  if (width < 768) return Math.round(baseSize * 0.85);
  if (width < 1366) return Math.round(baseSize * 0.95);
  return baseSize;
}

function getResponsiveRadius() {
  return window.innerWidth < 768 ? '40%' : '45%';
}

function buildMsgChartOption() {
  const ICON_DIR = new URL('./images/msg-icons/', document.baseURI).href;

  const weatherIcons = {
    one: ICON_DIR + '1.png',
    two: ICON_DIR + '2.png',
    three: ICON_DIR + '3.png',
    four: ICON_DIR + '4.png',
    five: ICON_DIR + '5.png',
    six: ICON_DIR + '6.png',
    seven: ICON_DIR + '7.png',
    eight: ICON_DIR + '8.png',
    nine: ICON_DIR + '9.png'
  };

  // ✅ EDIT YOUR REAL DATA HERE
  const rawData = [
    { name: '文本', value: 62794, icon: 'one' },
    { name: '表情包', value: 36068, icon: 'two' },
    { name: '引用消息', value: 9885, icon: 'three' },
    { name: '拍一拍等系统消息', value: 1889, icon: 'four' },
    { name: '图片', value: 1683, icon: 'five' },
    { name: '语音', value: 183, icon: 'six' },
    { name: '视频', value: 128, icon: 'seven' },
    { name: '音视频通话', value: 20, icon: 'eight' },
    { name: '音频', value: 3, icon: 'nine' },
  ];

  // ✅ EDIT: small-slice visibility (lower = small slices bigger)
  const SMALL_SLICE_EXPONENT = 0.30;

  // ✅ EDIT: boost ONLY the biggest slice
  const BIGGEST_MULTIPLIER = 2.0;

  // ── "glass HUD" palette (galaxy theme) ─────────────────────────────
  const GLASS_BG = 'rgba(14, 10, 28, 0.72)';
  const GLASS_BORDER = 'rgba(145, 105, 255, 0.35)';
  const HR_LINE = 'rgba(145, 105, 255, 0.18)';
  const TEXT_SOFT = 'rgba(240, 235, 255, 0.65)';
  const TEXT_MAIN = 'rgba(245, 242, 255, 0.92)';
  const TEXT_ACCENT = 'rgba(195, 178, 255, 0.95)';

  function displayValue(v) {
    return Math.pow(v, SMALL_SLICE_EXPONENT);
  }

  const totalReal = rawData.reduce((s, d) => s + d.value, 0);
  const maxRealValue = Math.max(...rawData.map(d => d.value));

  const seriesData = rawData.map(d => {
    const base = displayValue(d.value);
    const boosted = (d.value === maxRealValue) ? base * BIGGEST_MULTIPLIER : base;
    return { name: d.name, value: boosted, realValue: d.value, icon: d.icon };
  });

  function buildRichTableForFirstSlice() {
    const lines = [
      '{abg|消息类型}',  // Header
      '  {iconPad|}{weatherHead|}{iconGap|}{valueHead|Count}{rateHead|Percent}{spacer|}',  // ✅ Add spacer
      '{hr|}'
    ];

    for (const d of rawData) {
      const pct = (d.value / totalReal) * 100;
      const isMax = d.value === maxRealValue;

      lines.push(
        `  {iconPad|}{${d.icon}|}{iconGap|}{${isMax ? 'valueHot' : 'value'}|${d.value.toLocaleString()}}{${isMax ? 'rateHot' : 'rate'}|${pct.toFixed(1)}%}{spacer|}`  // ✅ Add spacer
      );
    }

    return lines.join('\n');
  }

  // Galaxy color palette for pie slices
  const galaxyColors = [
    '#8b5cf6', // purple
    '#a78bfa', // light purple
    '#6366f1', // indigo
    '#818cf8', // light indigo
    '#4f46e5', // dark indigo
    '#7c3aed', // violet
    '#5b21b6', // dark purple
    '#6d28d9', // medium purple
    '#9333ea'  // bright purple
  ];

  const option = {
    backgroundColor: 'transparent',
    color: galaxyColors,
    // ✅ TITLE ADDED HERE - This makes the chart title appear
    title: {
      text: '消息类型分布',
      left: 'center',
      top: 15,
      textStyle: {
        color: 'rgba(240, 235, 255, 0.95)',
        fontSize: 18,
        fontWeight: 600
      }
    },

    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(14, 10, 28, 0.92)',
      borderColor: 'rgba(145, 105, 255, 0.4)',
      borderWidth: 1,
      textStyle: {
        color: TEXT_MAIN
      },
      formatter: (p) => {
        const real = p.data.realValue;
        const realPct = (real / totalReal) * 100;
        return `${p.name}<br/>${real.toLocaleString()} (${realPct.toFixed(2)}%)`;
      }
    },
    series: [{
      name: '消息类型',
      type: 'pie',
      radius: getResponsiveRadius(),  // ✅ Responsive! Keeps your 45%
      center: ['50%', '59%'],  // ✅ UNCHANGED - Pie stays exactly where you had it
      selectedMode: 'single',
      data: seriesData,
      label: {
        show: true,
        formatter: '{b}',
        fontSize: getResponsiveFontSize(14),  // ✅ Responsive, smaller than your 18
        fontFamily: 'norm, sans-serif',
        color: TEXT_MAIN
      },
      labelLine: {
        length: 20,  // ✅ Shorter than your 30
        length2: 35,  // ✅ Shorter than your 50
        lineStyle: {
          width: 1.5,
          color: 'rgba(145, 105, 255, 0.45)'
        }
      },
      itemStyle: {
        borderRadius: 4,
        borderColor: 'rgba(26, 26, 46, 0.6)',
        borderWidth: 2,
        shadowBlur: 8,
        shadowColor: 'rgba(139, 92, 246, 0.3)'
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 15,
          shadowOffsetX: 0,
          shadowColor: 'rgba(139, 92, 246, 0.6)'
        },
        label: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      animationType: 'scale',
      animationEasing: 'cubicOut',
      animationDuration: 1200
    }]
  };

  // ─────────────────────────────────────────────
  // Rich table label (only for first slice)
  // ─────────────────────────────────────────────
  option.series[0].data[0].label = {
    formatter: buildRichTableForFirstSlice(),

    backgroundColor: GLASS_BG,
    borderColor: GLASS_BORDER,
    borderWidth: 1,
    borderRadius: 12,
    padding: [6, 8, 6, 8],  // ✅ Reduced padding (was [10, 12, 10, 12])

    shadowBlur: 18,
    shadowColor: 'rgba(0, 0, 0, 0.55)',
    shadowOffsetY: 10,

    offset: [-10, 5],  // x loc of table

    rich: {
      iconGap: { width: 6 },  // ✅ Reduced from 10
      title: {
        fontSize: 12,  // ✅ Smaller
        fontWeight: '700',
        color: 'rgba(240, 235, 255, 0.95)',
        align: 'center',
        padding: [2, 0, 4, 0]
      },

      // ✅ This is the blue/purple header box at the top of the table
      abg: {
        backgroundColor: 'rgba(145, 105, 255, 0.30)',  // ✅ More visible (was 0.22)
        width: 137,  // ✅ Narrower (was 200)
        height: 15,  // ✅ Shorter (was 26)
        borderRadius: [6, 6, 0, 0],
        align: 'center',
        verticalAlign: 'middle',
        color: 'rgba(240, 235, 255, 0.98)',  // ✅ Brighter text
        fontSize: 13,  // ✅ Slightly smaller
        fontWeight: 700,
        padding: [0, 0, 0, 0]
      },

      iconPad: { width: 8 },  // ✅ Reduced from 12

      // ✅ SMALLER ICONS = SHORTER ROWS
      one:   { width: 18, height: 18, align: 'left', backgroundColor: { image: weatherIcons.one } },
      two:   { width: 18, height: 18, align: 'left', backgroundColor: { image: weatherIcons.two } },
      three: { width: 18, height: 18, align: 'left', backgroundColor: { image: weatherIcons.three } },
      four:  { width: 18, height: 18, align: 'left', backgroundColor: { image: weatherIcons.four } },
      five:  { width: 18, height: 18, align: 'left', backgroundColor: { image: weatherIcons.five } },
      six:   { width: 18, height: 18, align: 'left', backgroundColor: { image: weatherIcons.six } },
      seven: { width: 18, height: 18, align: 'left', backgroundColor: { image: weatherIcons.seven } },
      eight: { width: 18, height: 18, align: 'left', backgroundColor: { image: weatherIcons.eight } },
      nine:  { width: 18, height: 18, align: 'left', backgroundColor: { image: weatherIcons.nine } },

      // ✅ Column headers - smaller
      weatherHead: {
        fontSize: 10,  // ✅ Smaller
        width: 42,  // ✅ Narrower (was 52)
        height: 18,  // ✅ Matches icon height
        color: TEXT_SOFT,
        align: 'left',
      },
      valueHead: {
        fontSize: 10,
        width: 36,  // ✅ Narrower (was 44)
        color: TEXT_SOFT,
        align: 'left',
        padding: [0, 15, 0, -15]  // ✅ Adjusted
      },
      rateHead: {
        fontSize: 10,
        width: 48,  // ✅ Narrower (was 58)
        color: TEXT_SOFT,
        align: 'left'
      },

      hr: {
        width: '100%',
        height: 0,
        borderWidth: 1,
        borderColor: HR_LINE
      },

      // ✅ Data cells - smaller and more compact
      value: {
        fontSize: 11,  // ✅ Smaller (was 12)
        width: 36,  // ✅ Narrower
        color: TEXT_MAIN,
        align: 'left',
        padding: [1, 0, 1, 8],  // ✅ Less padding
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
      },
      rate: {
        fontSize: 11,
        width: 48,  // ✅ Narrower
        color: TEXT_ACCENT,
        align: 'left',
        padding: [1, 0, 1, 15],  // ✅ Less padding
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
      },

      valueHot: {
        fontSize: 11,
        width: 44,  // ✅ Adjusted
        color: 'rgba(255, 255, 255, 0.98)',
        align: 'left',
        padding: [1, -4, 1, 8],  // ✅ Less padding
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        backgroundColor: 'rgba(145, 105, 255, 0.14)',
        borderRadius: 6
      },
      rateHot: {
        fontSize: 11,
        width: 48,
        color: 'rgba(225, 210, 255, 0.98)',
        align: 'left',
        padding: [1, 8, 1, 12],  // ✅ Less padding
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
      },

    }
  };

  return option;
}

// Expose for password.js to call after unlock
window.renderMsgChart = function () {
  const dom = document.getElementById('msgChart');
  if (!dom) return;

  if (!msgChart) {
    msgChart = echarts.init(dom, 'dark', { renderer: 'canvas', useDirtyRect: false });
  }

  msgChart.setOption(buildMsgChartOption(), true);
  msgChart.resize();
  setTimeout(() => msgChart && msgChart.resize(), 150);
};

window.addEventListener('resize', () => msgChart && msgChart.resize());

console.log('renderMsgChart exists:', typeof window.renderMsgChart);