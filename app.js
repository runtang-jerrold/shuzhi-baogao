/* ========================================
   述职报告 - 主逻辑（数据驱动版）
   ======================================== */

// 全局数据
let reportData = null;
let currentPeriod = 'day';
let currentDate = null;
let charts = {};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  initBackground();
  initNavigation();
  initTimeToggle();
  initProjectionMode();
  renderHero();
  renderDashboard();
  renderCharts();
  renderStoreCompare();
  renderSkills();
  renderTimeline();
  initAnimations();
  updateDate();
});

// 加载JSON数据
async function loadData() {
  try {
    const response = await fetch('data.json');
    reportData = await response.json();
  } catch (error) {
    console.error('数据加载失败:', error);
    reportData = getDefaultData();
  }
}

// 默认数据（兜底）
function getDefaultData() {
  return {
    meta: { title: '杜金达 · 转正述职报告', lastUpdated: '2026-09-09' },
    profile: { name: '杜金达', department: '客服部', position: '售前+售后客服', startDate: '2026-09-02' },
    stores: [],
    dailyData: [],
    monthlySummary: { totalInquiries: 0, avgSatisfaction: 0, totalConversionAmount: 0 },
    skills: {},
    highlights: [],
    timeline: []
  };
}

// ========================================
// 3D粒子背景
// ========================================

function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const particleCount = 500;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 100;
    positions[i + 1] = (Math.random() - 0.5) * 100;
    positions[i + 2] = (Math.random() - 0.5) * 100;
    const t = Math.random();
    colors[i] = 0.39 + t * 0.1;
    colors[i + 1] = 0.4 + t * 0.2;
    colors[i + 2] = 0.95 - t * 0.3;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.5, vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);
  camera.position.z = 50;

  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  function animate() {
    requestAnimationFrame(animate);
    particles.rotation.x += 0.0003;
    particles.rotation.y += 0.0005;
    particles.rotation.x += mouseY * 0.0001;
    particles.rotation.y += mouseX * 0.0001;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// ========================================
// 导航
// ========================================

function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  window.addEventListener('scroll', () => {
    let current = '';
    document.querySelectorAll('.section').forEach(section => {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) current = section.getAttribute('id');
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) link.classList.add('active');
    });
  });
}

// ========================================
// 时间维度切换
// ========================================

function initTimeToggle() {
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriod = btn.dataset.period;
      renderDashboard();
      renderCharts();
    });
  });
}

// ========================================
// 获取汇总数据
// ========================================

function getSummary(period, dateStr) {
  const data = reportData.dailyData.filter(d => d.isWorkday && d.metrics);

  if (period === 'day' && dateStr) {
    const day = data.find(d => d.date === dateStr);
    return day ? calculateSummary([day]) : null;
  }

  if (period === 'week') {
    // 最近7天
    const recent = data.slice(-7);
    return calculateSummary(recent);
  }

  if (period === 'month') {
    return calculateSummary(data);
  }

  return reportData.monthlySummary;
}

function calculateSummary(days) {
  if (!days.length) return null;

  const totalInquiries = days.reduce((sum, d) => sum + (d.metrics?.totalInquiries || 0), 0);
  const totalAmount = days.reduce((sum, d) => sum + (d.metrics?.conversionAmount || 0), 0);
  const totalOrders = days.reduce((sum, d) => sum + (d.metrics?.conversionOrders || 0), 0);
  const totalItems = days.reduce((sum, d) => sum + (d.metrics?.conversionItems || 0), 0);
  const totalNotConverted = days.reduce((sum, d) => sum + (d.metrics?.notConverted || 0), 0);
  const totalPendingPayment = days.reduce((sum, d) => sum + (d.metrics?.pendingPayment || 0), 0);

  // 评价数：优先用 reviews，否则由评价率 × 接待量推算
  const totalReviews = days.reduce((sum, d) => {
    if (typeof d.metrics?.reviews === 'number') return sum + d.metrics.reviews;
    const rate = d.metrics?.reviewRate || 0;
    return sum + Math.round(rate / 100 * (d.metrics?.totalInquiries || 0));
  }, 0);

  const satisfactionDays = days.filter(d => d.metrics?.satisfaction > 0);
  const avgSatisfaction = satisfactionDays.length
    ? satisfactionDays.reduce((sum, d) => sum + d.metrics.satisfaction, 0) / satisfactionDays.length
    : 0;

  // 响应时长：按接待量加权
  const weightedResponse = days.reduce((sum, d) => sum + (d.metrics?.avgResponseTime || 0) * (d.metrics?.totalInquiries || 0), 0);
  const avgResponseTime = totalInquiries > 0 ? weightedResponse / totalInquiries : 0;

  // 30S应答率：按接待量加权
  const weightedRate30s = days.reduce((sum, d) => sum + (d.metrics?.responseRate30s || 0) * (d.metrics?.totalInquiries || 0), 0);
  const avgResponseRate30s = totalInquiries > 0 ? weightedRate30s / totalInquiries : 0;

  // 差评率：按接待量加权
  const weightedNeg = days.reduce((sum, d) => sum + (d.metrics?.negativeReviewRate || 0) * (d.metrics?.totalInquiries || 0), 0);
  const avgNegativeReviewRate = totalInquiries > 0 ? weightedNeg / totalInquiries : 0;

  return {
    totalInquiries,
    totalConversionAmount: totalAmount,
    totalConversionOrders: totalOrders,
    totalConversionItems: totalItems,
    totalNotConverted,
    totalPendingPayment,
    totalReviews,
    avgSatisfaction: avgSatisfaction.toFixed(2),
    avgResponseTime: avgResponseTime.toFixed(2),
    avgResponseRate30s: avgResponseRate30s.toFixed(2),
    avgNegativeReviewRate: avgNegativeReviewRate.toFixed(2),
    workingDays: days.length,
    avgDailyInquiries: (totalInquiries / days.length).toFixed(0),
    avgDailyConversionAmount: (totalAmount / days.length).toFixed(2)
  };
}

function getPreviousSummary(period, dateStr) {
  const data = reportData.dailyData.filter(d => d.isWorkday && d.metrics);

  if (period === 'day' && dateStr) {
    const idx = data.findIndex(d => d.date === dateStr);
    if (idx > 0) return calculateSummary([data[idx - 1]]);
    return null;
  }

  if (period === 'week') {
    const prev = data.slice(-14, -7);
    return prev.length ? calculateSummary(prev) : null;
  }

  if (period === 'month') {
    const mid = Math.floor(data.length / 2);
    const prev = data.slice(0, mid);
    return prev.length ? calculateSummary(prev) : null;
  }

  return null;
}

// 计算环比变化百分比
function calcChange(current, previous) {
  if (previous === null || previous === undefined || previous === 0) return null;
  return ((current - previous) / Math.abs(previous) * 100);
}

// 生成环比标签HTML
function changeHtml(change, invert = false) {
  if (change === null) return '<div class="dash-card-change neutral">暂无对比</div>';
  const isUp = change >= 0;
  // invert=true 表示下降是好事（如响应时长）
  const isGood = invert ? !isUp : isUp;
  const cls = Math.abs(change) < 0.05 ? 'neutral' : (isGood ? 'positive' : 'negative');
  const arrow = Math.abs(change) < 0.05 ? '' : (isUp ? '↑' : '↓');
  return `<div class="dash-card-change ${cls}">${arrow} ${Math.abs(change).toFixed(1)}% 环比</div>`;
}

// ========================================
// 渲染英雄区
// ========================================

function renderHero() {
  const { profile, monthlySummary } = reportData;
  const startDate = new Date(profile.startDate);
  const today = new Date();
  const daysCount = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

  animateNumber('days-count', daysCount);
  animateNumber('total-inquiries', monthlySummary.totalInquiries);
  animateAmount('total-amount', monthlySummary.totalConversionAmount);

  document.getElementById('hero-stats').innerHTML = `
    <div class="hero-stat">
      <div class="hero-stat-value">${monthlySummary.totalConversionOrders || 0}</div>
      <div class="hero-stat-label">促成订单</div>
    </div>
    <div class="hero-stat">
      <div class="hero-stat-value">${monthlySummary.avgSatisfaction || 0}%</div>
      <div class="hero-stat-label">平均满意度</div>
    </div>
    <div class="hero-stat">
      <div class="hero-stat-value">${monthlySummary.avgResponseTime || 0}s</div>
      <div class="hero-stat-label">平均响应</div>
    </div>
    <div class="hero-stat">
      <div class="hero-stat-value">${reportData.stores.filter(s => s.status === 'active').length}</div>
      <div class="hero-stat-label">服务店铺</div>
    </div>
  `;
}

function animateNumber(elementId, target) {
  const element = document.getElementById(elementId);
  if (!element) return;
  let current = 0;
  const increment = target / 50;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) { current = target; clearInterval(timer); }
    element.textContent = Math.floor(current).toLocaleString();
  }, 30);
}

function animateAmount(elementId, target) {
  const element = document.getElementById(elementId);
  if (!element) return;
  let current = 0;
  const increment = target / 50;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) { current = target; clearInterval(timer); }
    element.textContent = '¥' + current.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }, 30);
}

// ========================================
// 渲染数据中心
// ========================================

function renderDashboard() {
  renderDateSelector();
  renderDashboardCards();
  renderAnalysis();
}

function renderDateSelector() {
  const container = document.getElementById('date-selector');
  if (!container) return;

  if (currentPeriod === 'day') {
    const workdays = reportData.dailyData.filter(d => d.isWorkday && d.metrics);
    container.innerHTML = workdays.map(d => `
      <button class="date-btn ${d.date === currentDate ? 'active' : ''}" data-date="${d.date}">
        ${d.date.slice(5)} 周${d.dayOfWeek}
      </button>
    `).join('');

    if (!currentDate && workdays.length) {
      currentDate = workdays[workdays.length - 1].date;
    }

    container.querySelectorAll('.date-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentDate = btn.dataset.date;
        renderDashboard();
        renderCharts();
      });
    });
  } else {
    container.innerHTML = '';
  }
}

function renderDashboardCards() {
  const container = document.getElementById('dashboard-cards');
  if (!container) return;

  const summary = getSummary(currentPeriod, currentDate);
  const prev = getPreviousSummary(currentPeriod, currentDate);

  if (!summary) {
    container.innerHTML = '<div class="dash-card"><div class="dash-card-label">暂无数据</div></div>';
    return;
  }

  const p = prev || {};
  const cards = [
    { label: '接待量', value: summary.totalInquiries, unit: '人', change: calcChange(summary.totalInquiries, p.totalInquiries) },
    { label: '促成金额', value: '¥' + Number(summary.totalConversionAmount).toLocaleString(), unit: '', change: calcChange(summary.totalConversionAmount, p.totalConversionAmount) },
    { label: '促成订单', value: summary.totalConversionOrders, unit: '单', change: calcChange(summary.totalConversionOrders, p.totalConversionOrders) },
    { label: '促成商品数', value: summary.totalConversionItems, unit: '件', change: calcChange(summary.totalConversionItems, p.totalConversionItems) },
    { label: '满意度', value: summary.avgSatisfaction, unit: '%', change: calcChange(Number(summary.avgSatisfaction), Number(p.avgSatisfaction)) },
    { label: '30S应答率', value: summary.avgResponseRate30s, unit: '%', change: calcChange(Number(summary.avgResponseRate30s), Number(p.avgResponseRate30s)) },
    { label: '平均响应', value: summary.avgResponseTime, unit: 's', change: calcChange(Number(summary.avgResponseTime), Number(p.avgResponseTime)), invert: true },
    { label: '咨询差评率', value: summary.avgNegativeReviewRate, unit: '%', change: calcChange(Number(summary.avgNegativeReviewRate), Number(p.avgNegativeReviewRate)), invert: true }
  ];

  container.innerHTML = cards.map(card => `
    <div class="dash-card">
      <div class="dash-card-value">${card.value}<span class="dash-card-unit">${card.unit || ''}</span></div>
      <div class="dash-card-label">${card.label}</div>
      ${changeHtml(card.change, card.invert)}
    </div>
  `).join('');
}

function renderAnalysis() {
  const container = document.getElementById('analysis-panel');
  if (!container) return;

  const summary = getSummary(currentPeriod, currentDate);
  if (!summary) { container.innerHTML = ''; return; }

  // 转化率
  const conversionRate = summary.totalInquiries > 0
    ? ((summary.totalConversionOrders / summary.totalInquiries) * 100).toFixed(1)
    : 0;

  // 客单价
  const avgOrderValue = summary.totalConversionOrders > 0
    ? (summary.totalConversionAmount / summary.totalConversionOrders).toFixed(2)
    : 0;

  // 评价率
  const reviewRate = summary.totalInquiries > 0
    ? ((summary.totalReviews / summary.totalInquiries) * 100).toFixed(1)
    : 0;

  // 店铺数量
  const activeStores = reportData.stores.filter(s => s.status === 'active').length;

  // 未下单率
  const notConverted = summary.totalNotConverted || 0;
  const notConvertedRate = summary.totalInquiries > 0
    ? ((notConverted / summary.totalInquiries) * 100).toFixed(1) : 0;

  container.innerHTML = `
    <div class="analysis-card">
      <h3>转化分析</h3>
      <div class="analysis-item">
        <span class="analysis-item-label">咨询转化率</span>
        <span class="analysis-item-value">${conversionRate}%</span>
      </div>
      <div class="analysis-item">
        <span class="analysis-item-label">客单价</span>
        <span class="analysis-item-value">¥${avgOrderValue}</span>
      </div>
      <div class="analysis-item">
        <span class="analysis-item-label">促成商品数</span>
        <span class="analysis-item-value">${summary.totalConversionItems || 0}件</span>
      </div>
      <div class="analysis-item">
        <span class="analysis-item-label">咨询未下单</span>
        <span class="analysis-item-value">${notConverted}人（${notConvertedRate}%）</span>
      </div>
      <div class="analysis-item">
        <span class="analysis-item-label">下单待付款</span>
        <span class="analysis-item-value">${summary.totalPendingPayment || 0}人</span>
      </div>
    </div>
    <div class="analysis-card">
      <h3>服务分析</h3>
      <div class="analysis-item">
        <span class="analysis-item-label">平均满意度</span>
        <span class="analysis-item-value">${summary.avgSatisfaction}%</span>
      </div>
      <div class="analysis-item">
        <span class="analysis-item-label">30S应答率</span>
        <span class="analysis-item-value">${summary.avgResponseRate30s}%</span>
      </div>
      <div class="analysis-item">
        <span class="analysis-item-label">咨询差评率</span>
        <span class="analysis-item-value">${summary.avgNegativeReviewRate}%</span>
      </div>
      <div class="analysis-item">
        <span class="analysis-item-label">评价率</span>
        <span class="analysis-item-value">${reviewRate}%</span>
      </div>
      <div class="analysis-item">
        <span class="analysis-item-label">总评价数</span>
        <span class="analysis-item-value">${summary.totalReviews}条</span>
      </div>
    </div>
    <div class="analysis-card">
      <h3>效率分析</h3>
      <div class="analysis-item">
        <span class="analysis-item-label">平均响应时长</span>
        <span class="analysis-item-value">${summary.avgResponseTime}s</span>
      </div>
      <div class="analysis-item">
        <span class="analysis-item-label">工作天数</span>
        <span class="analysis-item-value">${summary.workingDays}天</span>
      </div>
      <div class="analysis-item">
        <span class="analysis-item-label">日均接待</span>
        <span class="analysis-item-value">${summary.avgDailyInquiries}人</span>
      </div>
      <div class="analysis-item">
        <span class="analysis-item-label">日均促成</span>
        <span class="analysis-item-value">¥${summary.avgDailyConversionAmount}</span>
      </div>
      <div class="analysis-item">
        <span class="analysis-item-label">服务店铺数</span>
        <span class="analysis-item-value">${activeStores}家</span>
      </div>
    </div>
  `;
}

// ========================================
// 渲染图表
// ========================================

function renderCharts() {
  const data = reportData.dailyData.filter(d => d.isWorkday && d.metrics);
  const labels = data.map(d => d.date.slice(5));

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800 },
    resizeDelay: 200,
    devicePixelRatio: 1,
    plugins: {
      legend: {
        labels: { color: '#cbd5e1', font: { size: 13 } }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { size: 12 } },
        grid: { color: 'rgba(148, 163, 184, 0.1)' }
      },
      y: {
        ticks: { color: '#94a3b8', font: { size: 12 } },
        grid: { color: 'rgba(148, 163, 184, 0.1)' }
      }
    }
  };

  // 接待量趋势
  destroyChart('chart-inquiries');
  charts['chart-inquiries'] = new Chart(document.getElementById('chart-inquiries'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '接待量',
        data: data.map(d => d.metrics.totalInquiries),
        backgroundColor: 'rgba(129, 140, 248, 0.7)',
        borderColor: 'rgba(129, 140, 248, 1)',
        borderWidth: 2
      }]
    },
    options: chartOptions
  });

  // 促成金额趋势
  destroyChart('chart-amount');
  charts['chart-amount'] = new Chart(document.getElementById('chart-amount'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: '促成金额 (¥)',
        data: data.map(d => d.metrics.conversionAmount),
        borderColor: 'rgba(52, 211, 153, 1)',
        backgroundColor: 'rgba(52, 211, 153, 0.15)',
        fill: true, tension: 0.4, borderWidth: 3
      }]
    },
    options: chartOptions
  });

  // 满意度变化
  destroyChart('chart-satisfaction');
  charts['chart-satisfaction'] = new Chart(document.getElementById('chart-satisfaction'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: '满意度 (%)',
        data: data.map(d => d.metrics.satisfaction),
        borderColor: 'rgba(251, 191, 36, 1)',
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        fill: true, tension: 0.4, borderWidth: 3
      }]
    },
    options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 80, max: 105 } } }
  });

  // 响应时长变化
  destroyChart('chart-response');
  charts['chart-response'] = new Chart(document.getElementById('chart-response'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: '响应时长 (s)',
        data: data.map(d => d.metrics.avgResponseTime),
        borderColor: 'rgba(248, 113, 113, 1)',
        backgroundColor: 'rgba(248, 113, 113, 0.15)',
        fill: true, tension: 0.4, borderWidth: 3
      }]
    },
    options: chartOptions
  });
}

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); charts[id] = null; }
}

// ========================================
// 渲染店铺对比
// ========================================

function renderStoreCompare() {
  renderCompareTable();
  renderStoreCharts();
}

function renderCompareTable() {
  const container = document.getElementById('compare-table-wrapper');
  if (!container) return;

  const data = reportData.dailyData.filter(d => d.isWorkday && d.storeBreakdown);
  const storeStats = {};

  reportData.stores.filter(s => s.status === 'active').forEach(store => {
    storeStats[store.id] = {
      name: store.shortName,
      totalInquiries: 0,
      totalAmount: 0,
      totalOrders: 0,
      totalItems: 0,
      days: 0,
      satisfactionSum: 0,
      responseSum: 0,
      negRateSum: 0
    };
  });

  data.forEach(day => {
    day.storeBreakdown.forEach(sb => {
      if (storeStats[sb.storeId]) {
        const s = storeStats[sb.storeId];
        s.totalInquiries += sb.inquiries || 0;
        s.totalAmount += sb.conversionAmount || 0;
        s.totalOrders += sb.conversionOrders || 0;
        s.totalItems += sb.conversionItems || 0;
        s.days++;
        s.satisfactionSum += sb.satisfaction || 0;
        s.responseSum += sb.avgResponseTime || 0;
        s.negRateSum += sb.negativeReviewRate || 0;
      }
    });
  });

  const rows = Object.values(storeStats).map(s => ({
    ...s,
    avgSatisfaction: s.days > 0 ? (s.satisfactionSum / s.days).toFixed(1) : 0,
    avgResponse: s.days > 0 ? (s.responseSum / s.days).toFixed(2) : 0,
    avgNegRate: s.days > 0 ? (s.negRateSum / s.days).toFixed(2) : 0,
    conversionRate: s.totalInquiries > 0 ? ((s.totalOrders / s.totalInquiries) * 100).toFixed(1) : 0
  }));

  const maxInquiries = Math.max(...rows.map(r => r.totalInquiries));
  const maxAmount = Math.max(...rows.map(r => r.totalAmount));
  const minResponse = Math.min(...rows.filter(r => Number(r.avgResponse) > 0).map(r => Number(r.avgResponse)));

  container.innerHTML = `
    <table class="compare-table">
      <thead>
        <tr>
          <th>店铺</th>
          <th>接待量</th>
          <th>促成金额</th>
          <th>订单数</th>
          <th>商品数</th>
          <th>转化率</th>
          <th>满意度</th>
          <th>平均响应</th>
          <th>差评率</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.name}</td>
            <td class="${r.totalInquiries === maxInquiries ? 'best-value' : ''}">${r.totalInquiries}</td>
            <td class="${r.totalAmount === maxAmount ? 'best-value' : ''}">¥${r.totalAmount.toLocaleString()}</td>
            <td>${r.totalOrders}</td>
            <td>${r.totalItems}</td>
            <td>${r.conversionRate}%</td>
            <td>${r.avgSatisfaction}%</td>
            <td class="${Number(r.avgResponse) === minResponse ? 'best-value' : ''}">${r.avgResponse}s</td>
            <td>${r.avgNegRate}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderStoreCharts() {
  const data = reportData.dailyData.filter(d => d.isWorkday && d.storeBreakdown);
  const storeTotals = {};

  data.forEach(day => {
    day.storeBreakdown.forEach(sb => {
      if (!storeTotals[sb.storeId]) storeTotals[sb.storeId] = { inquiries: 0, amount: 0 };
      storeTotals[sb.storeId].inquiries += sb.inquiries || 0;
      storeTotals[sb.storeId].amount += sb.conversionAmount || 0;
    });
  });

  const activeStores = reportData.stores.filter(s => s.status === 'active');
  const labels = activeStores.map(s => s.shortName);
  const colors = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa'];

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800 },
    resizeDelay: 200,
    devicePixelRatio: 1,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#cbd5e1', font: { size: 13 }, padding: 20 }
      }
    }
  };

  // 接待量占比
  destroyChart('chart-store-inquiries');
  charts['chart-store-inquiries'] = new Chart(document.getElementById('chart-store-inquiries'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: activeStores.map(s => storeTotals[s.id]?.inquiries || 0),
        backgroundColor: colors.slice(0, activeStores.length),
        borderWidth: 2,
        borderColor: '#1e293b'
      }]
    },
    options: doughnutOptions
  });

  // 促成金额占比
  destroyChart('chart-store-amount');
  charts['chart-store-amount'] = new Chart(document.getElementById('chart-store-amount'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: activeStores.map(s => storeTotals[s.id]?.amount || 0),
        backgroundColor: colors.slice(0, activeStores.length),
        borderWidth: 2,
        borderColor: '#1e293b'
      }]
    },
    options: doughnutOptions
  });
}

// ========================================
// 渲染技能雷达图
// ========================================

function renderSkills() {
  const radarContainer = document.getElementById('skills-radar');
  const listContainer = document.getElementById('skills-list');
  if (!radarContainer || !listContainer || !reportData.skills) return;

  const skills = reportData.skills;
  const skillNames = {
    communication: '沟通能力', productKnowledge: '产品知识',
    platformOperation: '平台操作', problemSolving: '问题解决', teamCollaboration: '团队协作'
  };

  const size = 300, center = size / 2, maxRadius = 120, levels = 5;
  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;

  for (let i = 1; i <= levels; i++) {
    const r = (maxRadius / levels) * i;
    const points = [];
    for (let j = 0; j < 5; j++) {
      const angle = (j * 72 - 90) * Math.PI / 180;
      points.push(`${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`);
    }
    svg += `<polygon points="${points.join(' ')}" class="radar-polygon"/>`;
  }

  const dataPoints = [];
  const values = Object.values(skills);
  for (let j = 0; j < 5; j++) {
    const angle = (j * 72 - 90) * Math.PI / 180;
    const r = (values[j] / 100) * maxRadius;
    dataPoints.push(`${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`);
  }
  svg += `<polygon points="${dataPoints.join(' ')}" class="radar-shape"/>`;

  for (let j = 0; j < 5; j++) {
    const angle = (j * 72 - 90) * Math.PI / 180;
    const r = (values[j] / 100) * maxRadius;
    svg += `<circle cx="${center + r * Math.cos(angle)}" cy="${center + r * Math.sin(angle)}" r="5" class="radar-dot"/>`;
  }

  const labels = Object.keys(skills).map(k => skillNames[k] || k);
  for (let j = 0; j < 5; j++) {
    const angle = (j * 72 - 90) * Math.PI / 180;
    const r = maxRadius + 25;
    svg += `<text x="${center + r * Math.cos(angle)}" y="${center + r * Math.sin(angle)}" class="radar-label">${labels[j]}</text>`;
  }
  svg += '</svg>';
  radarContainer.innerHTML = svg;

  listContainer.innerHTML = Object.entries(skills).map(([key, value]) => `
    <div class="skill-item fade-in">
      <div class="skill-header">
        <span class="skill-name">${skillNames[key] || key}</span>
        <span class="skill-value">${value}%</span>
      </div>
      <div class="skill-bar">
        <div class="skill-fill" style="width: 0%" data-width="${value}%"></div>
      </div>
    </div>
  `).join('');

  setTimeout(() => {
    document.querySelectorAll('.skill-fill').forEach(bar => { bar.style.width = bar.dataset.width; });
  }, 500);
}

// ========================================
// 渲染时间轴
// ========================================

function renderTimeline() {
  const container = document.getElementById('timeline');
  if (!container || !reportData.timeline) return;

  container.innerHTML = reportData.timeline.map((item, index) => `
    <div class="timeline-item ${index % 2 === 0 ? 'slide-in-left' : 'slide-in-right'}" style="transition-delay: ${index * 0.1}s">
      <div class="timeline-content">
        <div class="timeline-date">${item.date}</div>
        <div class="timeline-event">${item.event}</div>
        <div class="timeline-desc">${item.description}</div>
      </div>
      <div class="timeline-dot"></div>
      <div class="timeline-spacer"></div>
    </div>
  `).join('');
}

// ========================================
// 滚动动画
// ========================================

function initAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => observer.observe(el));

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('.hero-badge', { opacity: 0, y: 30, duration: 0.8, delay: 0.2 });
    gsap.from('.hero-title', { opacity: 0, y: 50, duration: 1, delay: 0.4 });
    gsap.from('.hero-subtitle', { opacity: 0, y: 30, duration: 0.8, delay: 0.6 });
    gsap.from('.hero-stats', { opacity: 0, y: 30, duration: 0.8, delay: 0.8 });
  }
}

// ========================================
// 大屏投影模式
// ========================================

function initProjectionMode() {
  const btn = document.getElementById('projection-btn');
  if (!btn) return;

  // 检查URL参数或本地存储
  const isProjection = new URLSearchParams(window.location.search).get('projection') === 'true'
    || localStorage.getItem('projectionMode') === 'true';

  if (isProjection) {
    document.body.classList.add('projection-mode');
    btn.classList.add('active');
  }

  btn.addEventListener('click', () => {
    document.body.classList.toggle('projection-mode');
    btn.classList.toggle('active');
    localStorage.setItem('projectionMode', document.body.classList.contains('projection-mode'));
  });
}

// ========================================
// 更新日期
// ========================================

function updateDate() {
  const dateElement = document.getElementById('nav-date');
  if (dateElement) {
    dateElement.textContent = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
