/* 数字里的一二·九 · 模块二：口号谱系可视化
   数据源：window.EVENTS_DATA（由 events.json 转写，已内嵌）
   设计：四大口号 → 历史指向 的谱系关系图（ECharts graph，力引导布局）
   交互：悬停 tooltip 显示口号全名/历史指向；点击节点高亮；顶部导出按钮 300dpi */

(function () {
  'use strict';

  var data = window.EVENTS_DATA;
  if (!data || !data.slogans) {
    console.error('数据缺失：EVENTS_DATA.slogans 不存在');
    return;
  }

  var slogans = data.slogans;
  var el = document.getElementById('chart-slogans');
  if (!el) {
    console.error('容器缺失：#chart-slogans 不存在');
    return;
  }

  // 口号节点配色（与模块一呼应，庄重历史主题）
  // 总纲 红 / 针对导火索 金 / 政治诉求 绿 / 行动号召 蓝灰
  var sloganColor = {
    '总纲': '#c0392b',
    '针对导火索': '#d4a04c',
    '政治诉求': '#5a8a5a',
    '行动号召': '#6b7b8c'
  };

  // ---- 构建 graph 节点与边（固定布局 layout:'none'，坐标百分比，避免力导图溢出）----
  var nodes = [];
  var links = [];
  var nodeMap = {}; // 去重：target 可能被多条口号共享

  // 口号固定位置：左侧竖排（x=14%，y 从 14% 到 86% 均分）
  var sloganPos = [
    { x: 14, y: 14 },
    { x: 14, y: 38 },
    { x: 14, y: 62 },
    { x: 14, y: 86 }
  ];

  slogans.forEach(function (s, i) {
    var key = 'slogan:' + i;
    nodeMap[key] = {
      name: s.text,
      id: key,
      x: sloganPos[i].x,
      y: sloganPos[i].y,
      symbolSize: 64,
      category: 0,
      slogan: s,
      itemStyle: {
        color: sloganColor[s.role] || '#c0392b',
        borderColor: '#1a1410',
        borderWidth: 2,
        shadowBlur: 14,
        shadowColor: 'rgba(192,57,43,0.5)'
      },
      label: {
        show: true,
        position: 'right',
        fontSize: 13,
        fontWeight: 'bold',
        color: '#ece4d8',
        // 完整显示口号
        formatter: function (p) {
          return p.data.name;
        },
        lineHeight: 17
      }
    };
    nodes.push(nodeMap[key]);
  });

  // 历史指向节点（target 去重，固定位置右侧）
  // 按口号顺序分配指向节点的 y 位置（每条口号 1-2 个 target）
  var targetPos = [];
  slogans.forEach(function (s, si) {
    var targets = s.target.split('/').map(function (t) { return t.trim(); }).filter(Boolean);
    targets.forEach(function (tg) {
      targetPos.push({ key: tg, si: si, count: targets.length });
    });
  });
  var tIdx = 0;
  targetPos.forEach(function (tp) {
    // 指向节点分布在右侧 x=72%，y 按口号对应位置错开
    var baseY = sloganPos[tp.si].y;
    // 若同口号有 2 个 target，上下错开 ±10
    var yOff = tp.count > 1 ? (tIdx % 2 === 0 ? -9 : 9) : 0;
    var tkey = 'target:' + tp.key;
    if (!nodeMap[tkey]) {
      nodeMap[tkey] = {
        name: tp.key,
        id: tkey,
        x: 72,
        y: baseY + yOff,
        symbolSize: 44,
        category: 1,
        itemStyle: {
          color: '#3d2f24',
          borderColor: '#d4a04c',
          borderWidth: 1.5,
          shadowBlur: 8,
          shadowColor: 'rgba(212,160,76,0.35)'
        },
        label: {
          show: true,
          position: 'right',
          fontSize: 11,
          color: '#a89b8a'
        }
      };
      nodes.push(nodeMap[tkey]);
    }
    // 连线：口号(tp.si) → 指向节点
    links.push({
      source: 'slogan:' + tp.si,
      target: tkey,
      lineStyle: {
        color: sloganColor[slogans[tp.si].role] || '#c0392b',
        width: 2,
        opacity: 0.7,
        curveness: 0.2
      }
    });
    tIdx++;
  });

  // ---- 图表初始化 ----
  var chart = echarts.init(el);

  var option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(37,28,22,0.95)',
      borderColor: '#d4a04c',
      borderWidth: 1,
      textStyle: { color: '#ece4d8', fontSize: 13 },
      formatter: function (p) {
        if (p.dataType === 'node') {
          var nd = p.data;
          if (nd.slogan) {
            var s = nd.slogan;
            return '<b style="color:#d4a04c">「' + s.text + '」</b><br/>' +
              '<span style="color:#a89b8a">定位：' + s.role + '</span><br/>' +
              '<span style="color:#ece4d8">' + s.desc + '</span>';
          }
          return '<b style="color:#d4a04c">指向</b> · ' + nd.name;
        }
        return '';
      }
    },
    legend: {
      show: true,
      top: 12,
      left: 'center',
      textStyle: { color: '#a89b8a', fontSize: 12 },
      data: [
        { name: '口号', icon: 'circle' },
        { name: '历史指向', icon: 'circle' }
      ]
    },
    series: [{
      type: 'graph',
      layout: 'none',      // 固定坐标（节点已设 x/y 百分比），避免力导图溢出
      data: nodes,
      links: links,
      categories: [
        { name: '口号', itemStyle: { color: '#c0392b' } },
        { name: '历史指向', itemStyle: { color: '#3d2f24' } }
      ],
      roam: true,          // 可拖拽/缩放
      draggable: true,     // 节点可拖动
      label: {
        show: true,
        position: 'bottom',
        lineHeight: 17,
        // 完整显示，不截断（口号名较短，历史指向节点名稍长）
        formatter: function (p) {
          return p.data.name;
        }
      },
      emphasis: {
        focus: 'adjacency',
        label: { show: true, color: '#fff' },
        lineStyle: { width: 3, opacity: 1 }
      },
      lineStyle: {
        curveness: 0.2,
        opacity: 0.7
      }
    }]
  };

  chart.setOption(option);

  window.addEventListener('resize', function () { chart.resize(); });

  // ---- 导出 300dpi 静态图（ECharts getDataURL pixelRatio 3.125 ≈ 300dpi，离屏放大容器确保 ≥2MB）----
  var exportBtn = document.getElementById('btn-export-slogans');
  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      exportBtn.disabled = true;
      exportBtn.textContent = '导出中…';
      try {
        // 离屏放大容器：3000×2000，配合 pixelRatio 3.125 → 300dpi
        var off = document.createElement('div');
        off.style.width = '3000px';
        off.style.height = '2000px';
        off.style.position = 'absolute';
        off.style.left = '-9999px';
        off.style.visibility = 'hidden';
        document.body.appendChild(off);
        var offChart = echarts.init(off);
        offChart.setOption(option);
        // 等一帧渲染
        var url = offChart.getDataURL({
          type: 'png',
          pixelRatio: 3.125, // 300/96 ≈ 3.125，等效 300dpi
          backgroundColor: '#1a1410',
          excludeComponents: ['toolbox']
        });
        offChart.dispose();
        document.body.removeChild(off);

        var a = document.createElement('a');
        a.href = url;
        a.download = '数字里的一二九_口号谱系_300dpi.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        exportBtn.textContent = '已导出 ✓';
        setTimeout(function () {
          exportBtn.disabled = false;
          exportBtn.textContent = '导出 300dpi 静态图';
        }, 2500);
      } catch (e) {
        console.error('导出失败：', e);
        exportBtn.disabled = false;
        exportBtn.textContent = '导出失败，请重试';
      }
    });
  }
})();
