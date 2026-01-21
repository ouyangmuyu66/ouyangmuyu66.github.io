let barChart2 = null;

function renderBarChart2() {
  const dom = document.getElementById('msgChart2');
  if (!dom) return;

  if (!barChart2) {
    barChart2 = echarts.init(dom, 'dark', { renderer: 'canvas', useDirtyRect: false });
  }

  const xAxisData = ['2025-05','2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01'];
  const data1 = [895,3915,12377,12927,6314,6173,6866,7932,2359];   // 发送(熙)
  const data2 = [1062,4064,11327,10939,4897,5631,6258,6991,1983]; // 接收(小意)

  const colorSend = 'rgb(86, 187, 255)'; // 发送(熙)
  const colorRecv = 'rgb(124, 255, 119)'; // 接收(小意)

  const option = {
    // ✅ one selected across both series
    selectedMode: 'single',

    legend: {
      data: ['发送(熙)', '接收(小意)'],
      bottom: 60,
      left: 'center',
      orient: 'horizontal',
      textStyle: { fontSize: 14 }
    },

    tooltip: { trigger: 'axis' },

    xAxis: {
      type: 'category',
      data: xAxisData,
      name: 'DATES',
      axisLine: { onZero: true },
      splitLine: { show: false }
    },

    yAxis: {
      type: 'value',
      min: 0,
      max: 25000,
      interval: 5000,
      nameTextStyle: {
      fontFamily: 'memo', // 或 'thin'
      fontSize: 18,},
      axisLabel: { formatter: (v) => v.toLocaleString() }
    },

    grid: {
      left: '22%',
      right: '22%',
      top: '32%',
      bottom: '15%',
      containLabel: true
    },

    series: [
      {
        name: '发送(熙)',
        type: 'bar',
        stack: 'one',
        data: data1,
        itemStyle: { color: colorSend },

        // hover glow (optional)
        emphasis: {
          itemStyle: {
            shadowBlur: 18,
            shadowColor: colorSend
          }
        },

        // ✅ selected glow (stays)
        select: {
          itemStyle: {
            color: colorSend,
            shadowBlur: 22,
            shadowColor: 'rgb(50, 146, 255)',
            borderWidth: 0,
            borderColor: 'transparent'
          }
        }
      },
      {
        name: '接收(小意)',
        type: 'bar',
        stack: 'one',
        data: data2,
        itemStyle: { color: colorRecv },

        emphasis: {
          itemStyle: {
            shadowBlur: 18,
            shadowColor: colorRecv
          }
        },

        select: {
          itemStyle: {
            color: colorRecv,
            shadowBlur: 22,
            shadowColor: 'rgb(80, 255, 74)',
            borderWidth: 0,
            borderColor: 'transparent'
          }
        }
      }
    ]
  };

  barChart2.setOption(option, true);
  barChart2.resize();

  // =============================
  // ✅ CLICK behavior:
  // - click bar => only that bar stays selected
  // - click empty => clear selection
  // =============================

  // remove old handlers (avoid stacking)
  barChart2.off('click');
  barChart2.getZr().off('click');

  // click empty space => clear
  barChart2.getZr().on('click', (e) => {
    if (!e.target) {
      barChart2.dispatchAction({ type: 'unselect', seriesIndex: 0 });
      barChart2.dispatchAction({ type: 'unselect', seriesIndex: 1 });
    }
  });

  // click bar => switch selection
  barChart2.on('click', (params) => {
    barChart2.dispatchAction({ type: 'unselect', seriesIndex: 0 });
    barChart2.dispatchAction({ type: 'unselect', seriesIndex: 1 });

    barChart2.dispatchAction({
      type: 'select',
      seriesIndex: params.seriesIndex,
      dataIndex: params.dataIndex
    });
  });
}

window.renderBarChart2 = renderBarChart2;
window.addEventListener('resize', () => barChart2 && barChart2.resize());
window.addEventListener('load', () => {
  if (window.renderBarChart2) window.renderBarChart2();
});