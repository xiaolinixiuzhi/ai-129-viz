/* 数字里的一二·九 · 模块一：时间节点可视化
   数据源：window.EVENTS_DATA（由 events.json 转写，已内嵌，file:// 直开无跨域）
   配色（人工设计，庄重历史主题）：
     背景 #6b7b8c 酝酿 #d4a04c 核心 #c0392b 后续 #5a8a5a
   渲染：ECharts 散点 + 时间基线，按 phase 分色，核心节点放大高亮，悬停显示完整描述 */

(function () {
  'use strict';

  var data = window.EVENTS_DATA;
  if (!data || !data.timeline) {
    console.error('数据缺失：EVENTS_DATA.timeline 不存在');
    return;
  }

  var phaseColor = {
    '背景': '#6b7b8c',
    '酝酿': '#d4a04c',
    '核心': '#c0392b',
    '后续': '#5a8a5a'
  };

  // 按 phase 分组，每组内按时间排序，计算 y 轴位置
  var phases = ['背景', '酝酿', '核心', '后续'];
  var phaseY = {};
  phases.forEach(function (p, i) {
    phaseY[p] = (phases.length - 1 - i) * 80; // 核心居中偏上
  });

  var seriesData = [];
  var xLabels = [];
  data.timeline.forEach(function (node, idx) {
    var y = phaseY[node.phase] || 0;
    var isCore = node.highlight || node.phase === '核心';
    seriesData.push({
      name: node.date,
      value: [idx, y],
      // 存储原始节点信息供 tooltip
      nodeData: node,
      symbolSize: isCore ? 26 : 16,
      itemStyle: {
        color: isCore ? '#e74c3c' : (phaseColor[node.phase] || '#999'),
        borderColor: isCore ? '#fff' : '#1a1410',
        borderWidth: isCore ? 3 : 2,
        shadowBlur: isCore ? 20 : 6,
        shadowColor: isCore ? 'rgba(231,76,60,0.8)' : 'rgba(0,0,0,0.5)'
      }
    });
    xLabels.push(node.date);
  });

  var chart = echarts.init(document.getElementById('chart-timeline'));

  var option = {
    backgroundColor: 'transparent',
    grid: {
      left: 80,
      right: 40,
      top: 60,
      bottom: 90
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(37,28,22,0.95)',
      borderColor: '#c0392b',
      borderWidth: 1,
      textStyle: { color: '#ece4d8', fontSize: 13 },
      formatter: function (p) {
        var n = p.data.nodeData;
        var head = '<b style="color:#d4a04c">' + n.date + '</b> · ' + n.title;
        return head + '<br/>' +
          '<span style="color:#a89b8a">' + n.desc + '</span>';
      }
    },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLabel: {
        color: '#a89b8a',
        fontSize: 11,
        rotate: 38,
        interval: 0
      },
      axisLine: { lineStyle: { color: '#3d2f24' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      min: -40,
      max: 320,
      show: false
    },
    series: [{
      type: 'scatter',
      data: seriesData,
      // 时间基线
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { color: '#c0392b', type: 'dashed', width: 1.5, opacity: 0.5 },
        label: { show: false },
        data: [{ yAxis: 0 }]
      }
    }],
    // 图例（phase 分色说明）
    legend: {
      show: true,
      top: 12,
      left: 'center',
      textStyle: { color: '#a89b8a', fontSize: 12 },
      data: phases.map(function (p) { return p; })
    }
  };

  // 自定义图例颜色（散点无内置图例，用 graphic 或 legend data 模拟）
  option.legend.data = phases.map(function (p) { return p; });

  chart.setOption(option);

  // 图例点击只做展示，不过滤（保持全部节点可见）
  window.addEventListener('resize', function () { chart.resize(); });
})();
