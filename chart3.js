let chart3 = null;

function renderChart3() {
  const dom = document.getElementById('chart3');
  if (!dom) return;

  if (!chart3) {
    chart3 = echarts.init(dom, null, { renderer: 'canvas', useDirtyRect: false });
  }

  const xData = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0') + ':00');

  const yData = [
    4300, 4200, 4000, 2700, 1700, 1100,
    365, 420, 900, 2500, 5100, 5800,
    6000, 5900, 6100, 4300, 7000, 6500,
    6200, 6500, 9100, 9483, 8500, 5100
  ];

  // Galaxy theme colors
  const LINE_COLOR = '#8b5cf6';
  const AREA_COLOR = 'rgba(139, 92, 246, 0.15)';
  const GRID_COLOR = 'rgba(145, 105, 255, 0.12)';
  const TEXT_COLOR = 'rgba(240, 235, 255, 0.85)';
  const AXIS_COLOR = 'rgba(180, 160, 255, 0.3)';

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: '聊天时段',
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
      data: ['聊天频率'],
      textStyle: {
        color: TEXT_COLOR,
        fontSize: 13
      }
    },
    grid: { 
      left: '12%', 
      right: '12%', 
      top: '25%', 
      bottom: '15%'
    },
    tooltip: {
      trigger: 'axis',
      triggerOn: 'mousemove|click',
      axisPointer: { 
        type: 'line',
        lineStyle: {
          color: 'rgba(139, 92, 246, 0.5)',
          width: 2
        }
      },
      backgroundColor: 'rgba(14, 10, 28, 0.92)',
      borderColor: 'rgba(145, 105, 255, 0.4)',
      borderWidth: 1,
      textStyle: {
        color: TEXT_COLOR
      },
      valueFormatter: (v) => Number(v).toLocaleString()
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xData,
      axisTick: { show: false },
      axisLine: { 
        lineStyle: { color: AXIS_COLOR }
      },
      axisLabel: { 
        interval: (idx) => idx % 2 === 0,
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
    yAxis: {
      type: 'value',
      min: 0,
      max: 10000,
      splitNumber: 5,
      axisLabel: { 
        formatter: (v) => Number(v).toLocaleString(),
        color: TEXT_COLOR,
        fontSize: 11
      },
      axisLine: {
        show: true,
        lineStyle: { color: AXIS_COLOR }
      },
      splitLine: { 
        show: true, 
        lineStyle: { 
          color: GRID_COLOR,
          type: 'dashed'
        } 
      }
    },
    series: [
      {
        name: '聊天频率',
        type: 'line',
        smooth: true,
        data: yData,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { 
          width: 2.5, 
          color: LINE_COLOR,
          shadowBlur: 8,
          shadowColor: 'rgba(139, 92, 246, 0.5)'
        },
        itemStyle: {
          color: '#1a1a2e',
          borderColor: LINE_COLOR,
          borderWidth: 2.5,
          shadowBlur: 6,
          shadowColor: 'rgba(139, 92, 246, 0.6)'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(139, 92, 246, 0.25)' },
              { offset: 1, color: 'rgba(139, 92, 246, 0.02)' }
            ]
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 12,
            shadowColor: 'rgba(139, 92, 246, 0.8)'
          }
        },
        markPoint: {
          silent: false,
          symbol: 'pin',
          symbolSize: 50,
          itemStyle: { 
            color: LINE_COLOR,
            shadowBlur: 10,
            shadowColor: 'rgba(139, 92, 246, 0.6)'
          },
          label: {
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            formatter: '{c}'
          },
          tooltip: {
            trigger: 'item',
            formatter: (p) => {
              const x = p.data?.coord?.[0];
              const y = p.data?.coord?.[1];
              return `${p.name}<br/>时间：${x}<br/>${p.seriesName}：${Number(y).toLocaleString()}`;
            }
          },
          data: [
            { type: 'min', name: '最小值' },
            { type: 'max', name: '最大值' }
          ]
        },
        markLine: {
          silent: true,
          symbol: ['none', 'arrow'],
          symbolSize: [0, 8],
          lineStyle: { 
            type: 'dashed', 
            width: 1.5, 
            color: 'rgba(139, 92, 246, 0.6)'
          },
          label: {
            show: true,
            position: 'end',
            offset: [35, 0],
            color: TEXT_COLOR,
            fontSize: 11,
            formatter: (p) => Number(p.value).toFixed(2)
          },
          data: [{ yAxis: 4704.58 }]
        }
      }
    ],
    // Smooth animation
    animationDuration: 1200,
    animationEasing: 'cubicOut'
  };

  chart3.setOption(option, true);
  chart3.resize();
}

window.renderChart3 = renderChart3;
window.addEventListener('resize', () => chart3 && chart3.resize());
