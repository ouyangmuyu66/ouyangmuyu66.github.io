

    let msgChart = null;

    function buildMsgChartOption() {
      const ROOT_PATH = 'https://echarts.apache.org/examples';
      const weatherIcons = {
        Sunny: ROOT_PATH + '/data/asset/img/weather/sunny_128.png',
        Cloudy: ROOT_PATH + '/data/asset/img/weather/cloudy_128.png',
        Showers: ROOT_PATH + '/data/asset/img/weather/showers_128.png'
      };

      // ✅ EDIT YOUR REAL DATA HERE
      const rawData = [
        { name: '文本', value: 62794, icon: 'Sunny' },
        { name: '表情包', value: 36068, icon: 'Cloudy' },
        { name: '引用消息', value: 9885, icon: 'Showers' },
        { name: '拍一拍等系统消息', value: 1889, icon: 'Sunny' },
        { name: '图片', value: 1683, icon: 'Cloudy' },
        { name: '语音', value: 183, icon: 'Showers' },
        { name: '视频', value: 128, icon: 'Cloudy' },
        { name: '音视频通话', value: 20, icon: 'Cloudy' },
        { name: '音频', value: 3, icon: 'Cloudy' },
      ];

      // ✅ EDIT: small-slice visibility (lower = small slices bigger)
      const SMALL_SLICE_EXPONENT = 0.30;

      // ✅ EDIT: boost ONLY the biggest slice
      const BIGGEST_MULTIPLIER = 2.0;

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
          '{title|消息类型}{abg|}',
          '  {weatherHead|Icon}{valueHead|Count}{rateHead|Percent}',
          '{hr|}'
        ];
        for (const d of rawData) {
          const pct = (d.value / totalReal) * 100;
          lines.push(`  {${d.icon}|}{value|${d.value}}{rate|${pct.toFixed(1)}%}`);
        }
        return lines.join('\n');
      }

      const option = {
        
        tooltip: {
          trigger: 'item',
          formatter: (p) => {
            const real = p.data.realValue;
            const realPct = (real / totalReal) * 100;
            return `${p.name}<br/>${real.toLocaleString()} (${realPct.toFixed(2)}%)`;
          }
        },
        series: [{
          name: '消息类型',
          type: 'pie',
          radius: '45%',
          center: ['50%', '59%'], // X, Y bigger goes down
          selectedMode: 'single',
          data: seriesData,
          label: { 
            show: true,
            formatter: '{b}',
            fontSize: 18,
            fontFamily: 'norm, sans-serif',
          
          },

          labelLine: { 
            length: 30, 
            length2: 50,
            
            lineStyle: {
              width: 1,
              
            }
          } //length2 increase if table further away
        }]
      };

      // ─────────────────────────────────────────────
      // Rich table label (only for first slice)
      // ─────────────────────────────────────────────
      option.series[0].data[0].label = {
        // table content
        formatter: buildRichTableForFirstSlice(),

        // table container box
        backgroundColor: '#eee',
        borderColor: '#777',
        borderWidth: 1,
        borderRadius: 4,

        // table position offset relative to slice
        offset: [-10, 30], // [x, y] bigger go down

        // rich text styles (FULLY independent from pie label fontSize)
        rich: {
          /* ── table title ───────────────────── */
          title: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#333',
            align: 'center',
            padding: [6, 0, 4, 0]
          },

          /* ── top dark header bar ───────────── */
          abg: {
            backgroundColor: '#333',
            width: '100%',
            height: 25,
            align: 'right',
            borderRadius: [4, 4, 0, 0]
          },

          /* ── icons ─────────────────────────── */
          Sunny: {
            width: 22,
            height: 22,
            align: 'left',
            backgroundColor: { image: weatherIcons.Sunny }
          },
          Cloudy: {
            width: 22,
            height: 22,
            align: 'left',
            backgroundColor: { image: weatherIcons.Cloudy }
          },
          Showers: {
            width: 22,
            height: 22,
            align: 'left',
            backgroundColor: { image: weatherIcons.Showers }
          },

          /* ── column headers ────────────────── */
          weatherHead: {
            fontSize: 12,
            height: 24,
            color: '#333',
            align: 'left'
          },
          valueHead: {
            fontSize: 12,
            width: 70,
            color: '#333',
            align: 'center',
            padding: [0, 10, 0, 8]
          },
          rateHead: {
            fontSize: 12,
            width: 70,
            color: '#333',
            align: 'center',
            padding: [0, 8, 0, 0]
          },

          /* ── divider line ──────────────────── */
          hr: {
            width: '100%',
            height: 0,
            borderWidth: 0.5,
            borderColor: '#777'
          },

          /* ── table values ──────────────────── */
          value: {
            fontSize: 13,
            width: 70,
            color: '#333',
            align: 'left',
            padding: [0, 10, 0, 8]
          },
          rate: {
            fontSize: 13,
            width: 70,
            color: '#333',
            align: 'right',
            padding: [0, 8, 0, 0]
          }
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

// msgChart = echarts.init(dom, null, {
//   renderer: 'canvas',
//   useDirtyRect: false
// });      

      msgChart.setOption(buildMsgChartOption(), true);
      msgChart.resize();
      setTimeout(() => msgChart && msgChart.resize(), 150);
    };

    window.addEventListener('resize', () => msgChart && msgChart.resize());





console.log('renderMsgChart exists:', typeof window.renderMsgChart);