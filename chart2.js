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

  // Galaxy theme colors
  const colorSend = '#56bbff';
  const colorRecv = '#7cff77';
  const TEXT_COLOR = 'rgba(240, 235, 255, 0.85)';
  const GRID_COLOR = 'rgba(145, 105, 255, 0.12)';
  const AXIS_COLOR = 'rgba(180, 160, 255, 0.3)';

  const option = {
    backgroundColor: 'transparent',
    selectedMode: 'single',

    title: {
      text: '消息发送统计',
      left: 'center',
      top: 15,
      textStyle: {
        color: 'rgba(240, 235, 255, 0.95)',
        fontSize: 18,
        fontWeight: 600
      }
    },

    legend: {
      data: ['发送(熙)', '接收(小意)'],
      top: 50,
      left: 'center',
      orient: 'horizontal',
      textStyle: { 
        fontSize: 13,
        color: TEXT_COLOR
      }
    },

    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(14, 10, 28, 0.92)',
      borderColor: 'rgba(145, 105, 255, 0.4)',
      borderWidth: 1,
      textStyle: {
        color: TEXT_COLOR
      },
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(139, 92, 246, 0.15)'
        }
      }
    },

    xAxis: {
      type: 'category',
      data: xAxisData,
      name: 'DATES',
      nameTextStyle: {
        color: TEXT_COLOR,
        fontSize: 12
      },
      axisLine: { 
        onZero: true,
        lineStyle: {
          color: AXIS_COLOR
        }
      },
      axisLabel: {
        color: TEXT_COLOR,
        fontSize: 11,
        rotate: 0
      },
      splitLine: { show: false }
    },

    yAxis: {
      type: 'value',
      min: 0,
      max: 25000,
      interval: 5000,
      nameTextStyle: {
        fontFamily: 'memo',
        fontSize: 14,
        color: TEXT_COLOR
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: AXIS_COLOR
        }
      },
      axisLabel: { 
        formatter: (v) => v.toLocaleString(),
        color: TEXT_COLOR,
        fontSize: 11
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: GRID_COLOR,
          type: 'dashed'
        }
      }
    },

    grid: {
      left: '15%',
      right: '15%',
      top: '25%',
      bottom: '15%',
      containLabel: true
    },

    series: [
      {
        name: '发送(熙)',
        type: 'bar',
        stack: 'one',
        data: data1,
        itemStyle: { 
          color: colorSend,
          borderRadius: [0, 0, 0, 0]
        },

        emphasis: {
          itemStyle: {
            shadowBlur: 18,
            shadowColor: colorSend,
            color: colorSend
          }
        },

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
        itemStyle: { 
          color: colorRecv,
          borderRadius: [4, 4, 0, 0]
        },

        emphasis: {
          itemStyle: {
            shadowBlur: 18,
            shadowColor: colorRecv,
            color: colorRecv
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
    ],

    // Smooth animation
    animationDuration: 1200,
    animationEasing: 'cubicOut',
    animationDelay: (idx) => idx * 50
  };

  barChart2.setOption(option, true);
  barChart2.resize();

  // =============================
  // ✅ CLICK behavior:
  // - click bar => only that bar stays selected
  // - click empty => clear selection
  // =============================

  barChart2.off('click');
  barChart2.getZr().off('click');

  barChart2.getZr().on('click', (e) => {
    if (!e.target) {
      barChart2.dispatchAction({ type: 'unselect', seriesIndex: 0 });
      barChart2.dispatchAction({ type: 'unselect', seriesIndex: 1 });
    }
  });

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
