/* ========================================
   述职报告 - 主逻辑
   ======================================== */

// 全局数据
let reportData = null;

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  initBackground();
  initNavigation();
  renderHero();
  renderHighlights();
  renderDaily();
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

  // 创建粒子
  const particleCount = 500;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 100;
    positions[i + 1] = (Math.random() - 0.5) * 100;
    positions[i + 2] = (Math.random() - 0.5) * 100;

    // 渐变颜色（紫到蓝）
    const t = Math.random();
    colors[i] = 0.39 + t * 0.1;
    colors[i + 1] = 0.4 + t * 0.2;
    colors[i + 2] = 0.95 - t * 0.3;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  camera.position.z = 50;

  // 动画
  let mouseX = 0;
  let mouseY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  function animate() {
    requestAnimationFrame(animate);

    particles.rotation.x += 0.0003;
    particles.rotation.y += 0.0005;

    // 鼠标跟随
    particles.rotation.x += mouseY * 0.0001;
    particles.rotation.y += mouseX * 0.0001;

    renderer.render(scene, camera);
  }

  animate();

  // 窗口大小调整
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

  // 滚动高亮
  window.addEventListener('scroll', () => {
    let current = '';
    document.querySelectorAll('.section').forEach(section => {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

// ========================================
// 渲染英雄区
// ========================================

function renderHero() {
  const { profile, monthlySummary, dailyData } = reportData;

  // 计算入职天数
  const startDate = new Date(profile.startDate);
  const today = new Date();
  const daysCount = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

  // 数字动画
  animateNumber('days-count', daysCount);
  animateNumber('total-inquiries', monthlySummary.totalInquiries);
  animateAmount('total-amount', monthlySummary.totalConversionAmount);

  // 统计卡片
  const statsHtml = `
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
  document.getElementById('hero-stats').innerHTML = statsHtml;
}

// 数字动画
function animateNumber(elementId, target) {
  const element = document.getElementById(elementId);
  if (!element) return;

  let current = 0;
  const increment = target / 50;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current).toLocaleString();
  }, 30);
}

// 金额动画
function animateAmount(elementId, target) {
  const element = document.getElementById(elementId);
  if (!element) return;

  let current = 0;
  const increment = target / 50;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = '¥' + current.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }, 30);
}

// ========================================
// 渲染关键数字
// ========================================

function renderHighlights() {
  const container = document.getElementById('highlights-grid');
  if (!container || !reportData.highlights) return;

  container.innerHTML = reportData.highlights.map((item, index) => `
    <div class="highlight-card fade-in" style="transition-delay: ${index * 0.1}s">
      <div class="highlight-value">${item.value}</div>
      <div class="highlight-title">${item.title}</div>
      <div class="highlight-desc">${item.description}</div>
    </div>
  `).join('');
}

// ========================================
// 渲染每日数据
// ========================================

function renderDaily() {
  const container = document.getElementById('daily-cards');
  if (!container || !reportData.dailyData) return;

  container.innerHTML = reportData.dailyData.map((day, index) => {
    const isRest = !day.isWorkday || !day.metrics;
    const stores = day.stores.map(storeId => {
      const store = reportData.stores.find(s => s.id === storeId);
      return store ? store.shortName : storeId;
    });

    return `
      <div class="daily-card ${isRest ? 'daily-rest' : ''} fade-in" style="transition-delay: ${index * 0.05}s">
        <div class="daily-card-header">
          <div>
            <div class="daily-date">${day.date}</div>
            <div class="daily-day">周${day.dayOfWeek}</div>
          </div>
          <div class="daily-stores">
            ${stores.map(s => `<span class="store-tag">${s}</span>`).join('')}
          </div>
        </div>
        ${!isRest ? `
          <div class="daily-metrics">
            <div class="metric">
              <div class="metric-value">${day.metrics.totalInquiries || 0}</div>
              <div class="metric-label">接待量</div>
            </div>
            <div class="metric">
              <div class="metric-value">${day.metrics.responseRate30s || 0}%</div>
              <div class="metric-label">30S应答率</div>
            </div>
            <div class="metric">
              <div class="metric-value">${day.metrics.avgResponseTime || 0}s</div>
              <div class="metric-label">响应时长</div>
            </div>
            <div class="metric">
              <div class="metric-value">${day.metrics.satisfaction || 0}%</div>
              <div class="metric-label">满意度</div>
            </div>
            <div class="metric">
              <div class="metric-value">¥${(day.metrics.conversionAmount || 0).toFixed(2)}</div>
              <div class="metric-label">促成金额</div>
            </div>
            <div class="metric">
              <div class="metric-value">${day.metrics.conversionOrders || 0}</div>
              <div class="metric-label">促成订单</div>
            </div>
          </div>
        ` : '<div class="daily-notes">休息日</div>'}
        ${day.notes ? `<div class="daily-notes">${day.notes}</div>` : ''}
      </div>
    `;
  }).join('');
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
    communication: '沟通能力',
    productKnowledge: '产品知识',
    platformOperation: '平台操作',
    problemSolving: '问题解决',
    teamCollaboration: '团队协作'
  };

  // 雷达图SVG
  const size = 300;
  const center = size / 2;
  const maxRadius = 120;
  const levels = 5;

  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;

  // 背景网格
  for (let i = 1; i <= levels; i++) {
    const r = (maxRadius / levels) * i;
    const points = [];
    for (let j = 0; j < 5; j++) {
      const angle = (j * 72 - 90) * Math.PI / 180;
      points.push(`${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`);
    }
    svg += `<polygon points="${points.join(' ')}" class="radar-polygon"/>`;
  }

  // 数据形状
  const dataPoints = [];
  const values = Object.values(skills);
  for (let j = 0; j < 5; j++) {
    const angle = (j * 72 - 90) * Math.PI / 180;
    const r = (values[j] / 100) * maxRadius;
    dataPoints.push(`${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`);
  }
  svg += `<polygon points="${dataPoints.join(' ')}" class="radar-shape"/>`;

  // 数据点
  for (let j = 0; j < 5; j++) {
    const angle = (j * 72 - 90) * Math.PI / 180;
    const r = (values[j] / 100) * maxRadius;
    svg += `<circle cx="${center + r * Math.cos(angle)}" cy="${center + r * Math.sin(angle)}" r="5" class="radar-dot"/>`;
  }

  // 标签
  const labels = Object.keys(skills).map(k => skillNames[k] || k);
  for (let j = 0; j < 5; j++) {
    const angle = (j * 72 - 90) * Math.PI / 180;
    const r = maxRadius + 25;
    svg += `<text x="${center + r * Math.cos(angle)}" y="${center + r * Math.sin(angle)}" class="radar-label">${labels[j]}</text>`;
  }

  svg += '</svg>';
  radarContainer.innerHTML = svg;

  // 技能列表
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

  // 延迟填充动画
  setTimeout(() => {
    document.querySelectorAll('.skill-fill').forEach(bar => {
      bar.style.width = bar.dataset.width;
    });
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
  // Intersection Observer for fade-in animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => {
    observer.observe(el);
  });

  // GSAP ScrollTrigger for section animations
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // 英雄区动画
    gsap.from('.hero-badge', { opacity: 0, y: 30, duration: 0.8, delay: 0.2 });
    gsap.from('.hero-title', { opacity: 0, y: 50, duration: 1, delay: 0.4 });
    gsap.from('.hero-subtitle', { opacity: 0, y: 30, duration: 0.8, delay: 0.6 });
    gsap.from('.hero-stats', { opacity: 0, y: 30, duration: 0.8, delay: 0.8 });
  }
}

// ========================================
// 更新日期
// ========================================

function updateDate() {
  const dateElement = document.getElementById('nav-date');
  if (dateElement) {
    const now = new Date();
    dateElement.textContent = now.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}
