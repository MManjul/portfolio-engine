/**
 * Main Application Orchestrator for Mayank Manjul's Portfolio
 * High-performance HUD, Telemetry, Project Modals, TDD Resume, and Audio Hooks.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTelemetryBar();
  initThemeSwitcher();
  initAudioControls();
  initNavScrollspy();
  initBackToTop();
  initTacticalCarousel();
  initGoogleDriveResume();
  initProjectFilters();
  initProjectBlueprints();
  initProjectMediaAndTrailers();
  initResumeModal();
  initContactSystem();
  initSoundHooks();
  initCustomSelects();
});

/* ==========================================================================
   1. TOP ENGINE TELEMETRY BAR (UPTIME, FPS, MEMORY)
   ========================================================================== */
function initTelemetryBar() {
  const uptimeEl = document.getElementById('hud-uptime');
  const fpsEl = document.getElementById('hud-fps');
  const frametimeEl = document.getElementById('hud-frametime');
  const memEl = document.getElementById('hud-memory');
  const copyrightYear = document.getElementById('copyright-year');

  if (copyrightYear) copyrightYear.textContent = new Date().getFullYear();

  const startTime = Date.now();

  // Uptime clock
  setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const hrs = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    if (uptimeEl) uptimeEl.textContent = `${hrs}:${mins}:${secs}`;
  }, 1000);

  // Micro-telemetry tick
  let lastFrameTime = performance.now();
  let frameCount = 0;
  let fpsTimer = performance.now();

  function updateFPS(now) {
    frameCount++;
    if (now - fpsTimer >= 500) {
      const currentFps = ((frameCount * 1000) / (now - fpsTimer)).toFixed(1);
      const frameDelta = (1000 / currentFps).toFixed(1);

      if (fpsEl) fpsEl.textContent = currentFps;
      if (frametimeEl) frametimeEl.textContent = `${frameDelta} ms`;

      // Memory simulation around 18.4MB with slight realistic fluctuation
      if (memEl) {
        const mem = (18.2 + Math.random() * 0.5).toFixed(1);
        memEl.textContent = `${mem} MB`;
      }

      frameCount = 0;
      fpsTimer = now;
    }
    requestAnimationFrame(updateFPS);
  }
  requestAnimationFrame(updateFPS);
}

/* ==========================================================================
   2. THEME SWITCHER
   ========================================================================== */
function initThemeSwitcher() {
  const themeBtn = document.getElementById('btn-theme-selector');
  const themeMenu = document.getElementById('theme-menu');
  if (!themeBtn || !themeMenu) return;

  themeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    themeMenu.hidden = !themeMenu.hidden;
    if (window.soundFX) window.soundFX.playClick();
  });

  document.addEventListener('click', () => {
    themeMenu.hidden = true;
  });

  const buttons = themeMenu.querySelectorAll('button');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const themeClass = btn.dataset.theme;
      document.body.className = themeClass;
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      localStorage.setItem('manjul_theme', themeClass);
      drawRadarChart();
      setTimeout(drawRadarChart, 50);
      if (window.soundFX) window.soundFX.playLaserChime();
    });
  });

  // Restore saved theme
  const savedTheme = localStorage.getItem('manjul_theme');
  if (savedTheme) {
    document.body.className = savedTheme;
    buttons.forEach(b => {
      b.classList.toggle('active', b.dataset.theme === savedTheme);
    });
    setTimeout(drawRadarChart, 50);
  }
}

/* ==========================================================================
   3. AUDIO CONTROLS
   ========================================================================== */
function initAudioControls() {
  const audioBtn = document.getElementById('btn-audio-toggle');
  const audioStatus = document.getElementById('audio-status');
  if (!audioBtn) return;

  function updateDisplay() {
    if (window.soundFX) {
      const active = window.soundFX.isEnabled;
      const icon = audioBtn.querySelector('.btn-icon');
      if (icon) {
        icon.textContent = active ? '🔊' : '🔇';
      }
      if (audioStatus) {
        audioStatus.textContent = active ? 'ON' : 'MUTED';
        audioStatus.className = active ? 'text-cyan' : 'text-crimson';
      }
      audioBtn.title = active ? 'Mute Audio FX (Audio is Playing)' : 'Enable Audio FX (Audio is Muted)';
      audioBtn.classList.toggle('is-muted', !active);
    }
  }

  updateDisplay();

  audioBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.soundFX) {
      const state = window.soundFX.toggle();
      updateDisplay();
      if (state) window.soundFX.playLaserChime();
    }
  });
}

/* ==========================================================================
   4. NAVIGATION & SCROLLSPY
   ========================================================================== */
function initNavScrollspy() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.hud-section');

  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollPos = window.scrollY + 160;

    sections.forEach(sec => {
      if (scrollPos >= sec.offsetTop) {
        currentId = sec.getAttribute('id');
      }
    });

    if (currentId) {
      navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.nav === currentId);
      });
    }
  });

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      if (window.soundFX) window.soundFX.playClick();
    });
  });
}

/* ==========================================================================
   4C. RETURN TO TOP HUD NAVIGATION
   ========================================================================== */
function initBackToTop() {
  const btn = document.getElementById('btn-back-to-top');
  if (!btn) return;

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  };

  window.addEventListener('scroll', toggleVisibility, { passive: true });
  toggleVisibility();

  btn.addEventListener('click', () => {
    if (window.soundFX) window.soundFX.playClick();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/* ==========================================================================
   4B. HERO TACTICAL CAROUSEL (AGENT CARD, RADAR CHART, PROFILING, MILESTONES)
   ========================================================================== */
function initTacticalCarousel() {
  const frame = document.getElementById('hero-carousel-frame');
  const titleEl = document.getElementById('carousel-panel-title');
  const prevBtn = document.getElementById('btn-carousel-prev');
  const nextBtn = document.getElementById('btn-carousel-next');
  const indicatorDots = document.querySelectorAll('#carousel-indicators .indicator-dot');
  const slides = document.querySelectorAll('.carousel-slide');
  const footerRight = document.getElementById('carousel-footer-right');

  if (!frame || slides.length === 0) return;

  let currentSlide = 0;
  const totalSlides = slides.length;
  let autoTimer = null;

  function showSlide(index) {
    currentSlide = (index + totalSlides) % totalSlides;

    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === currentSlide);
    });

    indicatorDots.forEach((dot, idx) => {
      const isActive = (idx === currentSlide);
      dot.classList.toggle('active', isActive);
      if (isActive) {
        dot.setAttribute('title', isHovered ? 'PAUSED [HOVERING] - Release cursor to resume' : `Slide ${idx + 1} (Active)`);
      } else {
        dot.setAttribute('title', `Navigate to Slide ${idx + 1}`);
      }
    });

    const activeSlide = slides[currentSlide];
    if (activeSlide && titleEl) {
      titleEl.textContent = activeSlide.dataset.slideTitle || 'SYSTEM_DIAGNOSTICS';
    }

    if (footerRight) {
      footerRight.textContent = `SLIDE: 0${currentSlide + 1} / 0${totalSlides}`;
    }

    // If slide 1 (Radar chart), trigger canvas draw
    if (currentSlide === 1) {
      drawRadarChart();
      requestAnimationFrame(drawRadarChart);
      setTimeout(drawRadarChart, 60);
    }
  }

  function nextSlide() {
    showSlide(currentSlide + 1);
    if (window.soundFX) window.soundFX.playBlip(1100, 0.03);
  }

  function prevSlide() {
    showSlide(currentSlide - 1);
    if (window.soundFX) window.soundFX.playBlip(950, 0.03);
  }

  if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetAutoTimer(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetAutoTimer(); });

  indicatorDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const target = parseInt(dot.dataset.slide);
      showSlide(target);
      if (window.soundFX) window.soundFX.playBlip(1050, 0.03);
      resetAutoTimer();
    });
  });

  let isHovered = false;

  // Auto rotation with pause on hover and prompt resume on leave
  function startAutoTimer() {
    clearInterval(autoTimer);
    clearTimeout(autoTimer);
    if (isHovered) return;
    autoTimer = setInterval(() => {
      if (!isHovered) {
        showSlide(currentSlide + 1);
      }
    }, 5000); // 5s interval for smooth, noticeable transitions
  }

  function resetAutoTimer() {
    clearInterval(autoTimer);
    clearTimeout(autoTimer);
    if (!isHovered) {
      startAutoTimer();
    }
  }

  function pauseAutoTimer() {
    if (isHovered) return;
    isHovered = true;
    clearInterval(autoTimer);
    clearTimeout(autoTimer);
    autoTimer = null;
    frame.classList.add('is-paused');
    const activeDot = document.querySelector('#carousel-indicators .indicator-dot.active');
    if (activeDot) activeDot.setAttribute('title', 'PAUSED [HOVERING] - Release cursor to resume auto-cycle');
  }

  function resumeAutoTimer() {
    if (!isHovered) return;
    isHovered = false;
    frame.classList.remove('is-paused');
    const activeDot = document.querySelector('#carousel-indicators .indicator-dot.active');
    if (activeDot) activeDot.setAttribute('title', `Slide ${currentSlide + 1} (Active)`);
    clearInterval(autoTimer);
    clearTimeout(autoTimer);
    // Rotate to next slide within 1.8s of unhovering so the user gets immediate visual confirmation
    autoTimer = setTimeout(() => {
      if (!isHovered) {
        showSlide(currentSlide + 1);
        startAutoTimer();
      }
    }, 1800);
  }

  // Dual event listeners for ultra-reliable hover detection
  frame.addEventListener('mouseenter', pauseAutoTimer);
  frame.addEventListener('mouseleave', resumeAutoTimer);
  frame.addEventListener('pointerenter', pauseAutoTimer);
  frame.addEventListener('pointerleave', resumeAutoTimer);

  // Global cursor boundary fallback: guarantees unpause even if fast gesture exits without pointerleave
  document.addEventListener('mousemove', (e) => {
    if (isHovered && frame) {
      const rect = frame.getBoundingClientRect();
      const padding = 2; // Tolerance margin
      if (
        e.clientX < rect.left - padding ||
        e.clientX > rect.right + padding ||
        e.clientY < rect.top - padding ||
        e.clientY > rect.bottom + padding
      ) {
        resumeAutoTimer();
      }
    }
  });

  startAutoTimer();

  // Initial draw of radar canvas if available
  setTimeout(() => drawRadarChart(), 400);
}

/* Draws dynamic 6-axis attribute polar graph on canvas */
window.addEventListener('resize', () => { if (document.getElementById('radar-chart-canvas')) drawRadarChart(); });
function drawRadarChart() {
  const canvas = document.getElementById('radar-chart-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  const w = canvas.clientWidth || 320;
  const h = canvas.clientHeight || 220;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, w, h);

  // Read active theme CSS variables dynamically
  const comp = getComputedStyle(document.body);
  const accent = comp.getPropertyValue('--theme-accent').trim() || '#00f2fe';
  const rgb = comp.getPropertyValue('--theme-accent-rgb').trim() || '0, 242, 254';

  const centerX = w / 2;
  const centerY = h / 2 + 6;
  const radius = Math.min(centerX, centerY) - 26;

  const labels = [
    'MODERN C++20',
    'UE5 ARCHITECTURE',
    'NETCODE & REPLICATION',
    'LOW-LEVEL PROFILING',
    'PHYSICS & DYNAMICS',
    'LEADERSHIP & TDD'
  ];
  const values = [0.98, 0.96, 0.95, 0.95, 0.94, 0.92]; // Skills percentages
  const sides = labels.length;

  // 1. Concentric background polygon webs
  const levels = 4;
  for (let l = 1; l <= levels; l++) {
    const levelRadius = (radius / levels) * l;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 / sides) * i - Math.PI / 2;
      const x = centerX + Math.cos(angle) * levelRadius;
      const y = centerY + Math.sin(angle) * levelRadius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = l === levels ? `rgba(${rgb}, 0.45)` : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = l === levels ? 1.5 : 1;
    ctx.stroke();
  }

  // 2. Axis spokes
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 / sides) * i - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = `rgba(${rgb}, 0.25)`;
    ctx.stroke();

    // Spoke labels
    const labelX = centerX + Math.cos(angle) * (radius + 18);
    const labelY = centerY + Math.sin(angle) * (radius + 14);

    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(values[i] * 100)}%`, labelX, labelY);
  }

  // 3. Shaded Data Polygon with Theme Glow
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 / sides) * i - Math.PI / 2;
    const r = radius * values[i];
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  ctx.fillStyle = `rgba(${rgb}, 0.25)`;
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 4. Glowing vertex vertices
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 / sides) * i - Math.PI / 2;
    const r = radius * values[i];
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/* ==========================================================================
   4C. GOOGLE DRIVE RESUME CONFIGURATION & DOWNLOAD SYSTEM
   ========================================================================== */
function initGoogleDriveResume() {
  const heroDownloadBtn = document.getElementById('hero-download-resume-btn');
  const topbarDownloadBtn = document.getElementById('topbar-download-resume');
  const modalDownloadBtn = document.getElementById('modal-gdrive-download');

  const OFFICIAL_RESUME_URL = 'https://drive.google.com/file/d/1rQcI8EHY2sCMNXN2j-Doxnb8eUOrDM6y/view?usp=sharing';

  [heroDownloadBtn, topbarDownloadBtn, modalDownloadBtn].forEach(btn => {
    if (btn) {
      btn.href = OFFICIAL_RESUME_URL;
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
    }
  });
}

/* ==========================================================================
   5. PROJECT FILTERS
   ========================================================================== */
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      cards.forEach(card => {
        if (filter === 'all' || card.dataset.category.includes(filter)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });

      if (window.soundFX) window.soundFX.playClick();
    });
  });
}

/* ==========================================================================
   6. PROJECT BLUEPRINT MODAL (TECHNICAL CASE STUDIES)
   ========================================================================== */
const projectData = {
  'ecricket': {
    title: 'ECricket // Flagship AAA Unreal Engine 5 Title',
    company: 'LightFury Games • Mobile (Current Production) • PC &amp; Console (Future)',
    role: 'Senior Gameplay Programmer Level 4 (Principal Engineer)',
    timeline: 'May 2024 - Present',
    stack: 'Unreal Engine 5.x, Modern C++ (C++17/C++20), StateTree, Gameplay Tags, Unreal Insights, Perforce P4',
    image: 'assets/images/ecricket/ec3.jpg',
    screenshots: [
      'assets/images/ecricket/ec3.jpg',
      'assets/images/ecricket/ec4.jpg',
      'assets/images/ecricket/ec2.webp',
      'assets/images/ecricket/ec1.png'
    ],
    trailerUrl: 'https://www.youtube.com/watch?v=xkaYueCqsXI',
    content: `
      <h4>Architectural Challenge:</h4>
      <p>The batsman, fielders, and bowling actors had grown into an interwoven tangle of direct references across locomotion, animation, input, and network replication. Any change to locomotion broke adjacent disciplines, and gameplay tick overhead was compounding.</p>

      <h4>The System &amp; Solution:</h4>
      <ul>
        <li><strong>Decoupled Locomotion via StateTree:</strong> Rebuilt the character layer entirely around <strong>StateTree</strong> tasks and <strong>Gameplay Tags</strong>. Each locomotion, batting stance, and ability state is a self-contained task declaring requirements via tags rather than direct component references.</li>
        <li><strong>Network Replication:</strong> Animation and networking replicate only the lightweight Gameplay Tag container and state header instead of monolithic component structs.</li>
        <li><strong>Tick Budgeting &amp; Memory:</strong> Enforced strict tick groups; moved non-per-frame logic to timers and events, achieving zero per-frame heap allocations during the active gameplay tick.</li>
        <li><strong>Studio Governance (TDD/ECRICKET-7884):</strong> Authored the studio-wide C++ standard setting modern C++ ownership patterns, tick budgets, and Unreal Insights profiling protocols.</li>
      </ul>

      <h4>Unreal Insights Profiling &amp; Impact:</h4>
      <div class="quick-metrics-grid" style="margin-top: 16px;">
        <div class="metric-card"><span class="metric-val">120 FPS</span><span class="metric-desc">Target Frame Lock on Device Floor</span></div>
        <div class="metric-card"><span class="metric-val">0</span><span class="metric-desc">Per-Frame Heap Allocations in Tick</span></div>
        <div class="metric-card"><span class="metric-val">1 TDD</span><span class="metric-desc">Studio-Wide Standard (ECRICKET-7884)</span></div>
      </div>
    `
  },
  'sachin-saga': {
    title: 'Sachin Saga Cricket Champions // Premier Sports Ballistics Title',
    company: 'JetSynthesys Pvt Ltd • Pune, India',
    role: 'Senior Game Developer (Unity / Physics Core)',
    timeline: 'July 2017 - February 2019',
    stack: 'Unity 3D, C#, PhysX, Custom Ballistics Engine, Ragdoll Physics, Photon PUN',
    image: 'assets/images/sachin-saga/ss1.webp',
    screenshots: [
      'assets/images/sachin-saga/ss1.webp',
      'assets/images/sachin-saga/ss2.webp',
      'assets/images/sachin-saga/ss3.webp',
      'assets/images/sachin-saga/ss4.webp',
      'assets/images/sachin-saga/ss5.webp',
      'assets/images/sachin-saga/sachin-saga-1.jpg'
    ],
    trailerUrl: 'https://www.youtube.com/watch?v=OG-pipnXsZE',
    content: `
      <h4>Physics Engineering &amp; Ballistics Simulation:</h4>
      <p>Served in the core engineering team for the chart-topping cricket simulation featuring cricketing legend Sachin Tendulkar. Responsible for translating the nuances of real-world cricket into high-precision runtime physics loops.</p>

      <h4>Key Technical Solutions:</h4>
      <ul>
        <li><strong>Trajectory &amp; Swing Mathematics:</strong> Architected real-time projectile trajectory algorithms incorporating pitch friction, air resistance, spin rate, seam deviation, and bat sweet-spot kinetic energy transfer.</li>
        <li><strong>Ragdoll Physics Integration:</strong> Engineered dynamic ragdoll transitions and blend animation states to deliver bone-jarring catches, diving stops, and collision tumble physics.</li>
        <li><strong>Fielding AI Routines:</strong> Created predictive fielding AI calculating optimal interception angles and sprint deceleration curves.</li>
      </ul>

      <h4>Impact:</h4>
      <p>Achieved tens of millions of downloads and top-grossing status on Google Play &amp; Apple App Store.</p>
    `
  },
  'disney-byjus': {
    title: 'Disney • BYJU\'S Early Learn // Scaled Gamified Learning Engine',
    company: 'BYJU\'S • Bengaluru, India',
    role: 'Lead Engineer (Unity) • Employee of the Year (2021-2022)',
    timeline: 'November 2019 - January 2023',
    stack: 'Unity 3D, C#, Dynamic Asset Bundles, Unity Profiler, Component Architecture',
    image: 'assets/images/disney-byjus/disney-shape-6.png',
    screenshots: [
      'assets/images/disney-byjus/disney-shape-6.png',
      'assets/images/disney-byjus/immersive-learning-shape.png',
      'assets/images/disney-byjus/rewards-and-play-shape.png',
      'assets/images/disney-byjus/in-depth-shape.png',
      'assets/images/disney-byjus/personalised-shape.png',
      'assets/images/disney-byjus/parent-zone-shape.png'
    ],
    trailerUrl: 'https://www.youtube.com/watch?v=wqpdmX_3cZc&t=6s',
    content: `
      <h4>Architectural Leadership at Global Scale:</h4>
      <p>Served as Technical Lead for Disney • BYJU'S Early Learn, supporting millions of concurrent global learners across low-end and high-end mobile devices. Honored with the prestigious <strong>Employee of the Year Award (2021-2022)</strong> for proactive leadership and milestone excellence.</p>

      <h4>Major Achievements:</h4>
      <ul>
        <li><strong>35%+ Initial Install Footprint Reduction:</strong> Architected dynamic on-demand asset delivery modules and streaming pipelines, cutting initial download barrier dramatically and boosting user acquisition.</li>
        <li><strong>Mobile Device Profiling:</strong> Systematically investigated memory leaks, draw call batching, and garbage collection pauses using Unity Profiler, achieving consistent 60fps on entry-tier devices.</li>
        <li><strong>Engineering Pod Mentorship:</strong> Mentored, coached, and scaled a pod of game developers, conducting rigorous code reviews and enforcing clean architecture standards.</li>
      </ul>
    `
  },
  'lightfury-multiplayer': {
    title: 'Real-Time Multiplayer Architecture // Server-Authoritative Netcode',
    company: 'LightFury Games • Bengaluru, India',
    role: 'Senior Gameplay Programmer (Level 4 / Netcode)',
    timeline: 'May 2024 - Present',
    stack: 'Unreal Engine 5, Modern C++20, Server-Authoritative Netcode, Replication Graph, Client-Side Prediction, Lag Mitigation, Unreal Insights',
    image: '',
    trailerUrl: '',
    content: `
      <h4>Server-Authoritative Netcode &amp; Replication Architecture:</h4>
      <p>Architected and integrated server-authoritative multiplayer infrastructure for competitive gameplay in Unreal Engine 5 at LightFury Games, delivering rock-solid network replication with minimal bandwidth consumption across varying mobile and cross-platform connection conditions.</p>

      <h4>Engineering Highlights:</h4>
      <ul>
        <li><strong>Server-Authoritative Replication:</strong> Designed deterministic actor replication and property dirty-tracking routines, maintaining strict server authority while neutralizing desynchronization vulnerabilities.</li>
        <li><strong>Client-Side Prediction &amp; Rollback:</strong> Built responsive client-side prediction models and rollback reconciliations for fast-paced player locomotion and physics-driven ball states, ensuring zero perceived latency.</li>
        <li><strong>Network Profiling with Unreal Insights:</strong> Monitored RPC call frequencies, bunch fragmentation, and packet budgets using Unreal Insights NetProfiler to prevent network saturation on cellular data networks.</li>
      </ul>
    `
  },
  'm56-multiplayer': {
    get title() { return projectData['lightfury-multiplayer'].title; },
    get company() { return projectData['lightfury-multiplayer'].company; },
    get role() { return projectData['lightfury-multiplayer'].role; },
    get timeline() { return projectData['lightfury-multiplayer'].timeline; },
    get stack() { return projectData['lightfury-multiplayer'].stack; },
    get image() { return projectData['lightfury-multiplayer'].image; },
    get trailerUrl() { return projectData['lightfury-multiplayer'].trailerUrl; },
    get content() { return projectData['lightfury-multiplayer'].content; }
  },
  'dhoom-jet': {
    title: 'Dhoom: 3 Jet Speed // Hydrodynamic Arcade Simulation',
    company: 'Robosoft Technologies / Yash Raj Films',
    role: 'Game Developer',
    timeline: 'February 2014 - January 2016',
    stack: 'Unity 3D, C#, Hydrodynamics, PhysX, Mobile Optimization',
    image: '',
    trailerUrl: 'https://www.youtube.com/watch?v=yPFqbdfkBu4',
    content: `
      <h4>Hydrodynamics &amp; Arcade Racing Mechanics:</h4>
      <p>Engineered buoyant surface physics and high-speed jet-ski drifting for the official Bollywood blockbuster video game adaptation.</p>
      <ul>
        <li>Simulated wave buoyancy mathematics with responsive hull tilt and jump dynamics.</li>
        <li>Optimized dynamic obstacle spawning and draw call batching for smooth rendering on earlier mobile hardware.</li>
      </ul>
    `
  },
  'hanx-trivia': {
    title: 'Hanx Trivia // Apple Arcade Multi-Platform Release',
    company: 'M56 Technologies Pvt Ltd • Apple Arcade Ecosystem',
    role: 'Lead Game Developer (Unity / Apple Arcade)',
    timeline: 'January 2023 - May 2024',
    stack: 'Apple Arcade, Unity 3D, tvOS, macOS, iOS, iPadOS, MFi/Bluetooth Controllers, CloudKit, Game Center, WebSockets',
    image: 'assets/images/hanx-trivia/hanx-banner.webp',
    screenshots: [
      'assets/images/hanx-trivia/hanx-banner.webp',
      'assets/images/hanx-trivia/hanx-map-progress.webp',
      'assets/images/hanx-trivia/hanx-gameplay.webp',
      'assets/images/hanx-trivia/hanx-promo.webp'
    ],
    trailerUrl: 'https://www.youtube.com/watch?v=-1Wb6gzZYFw',
    content: `
      <h4>Apple Arcade Multi-Device Ecosystem Architecture:</h4>
      <p>Spearheaded the technical adaptation and architectural pipeline for the official live interactive trivia title developed in partnership with Academy Award-winning actor Tom Hanks, shipped across the entire <strong>Apple Arcade ecosystem</strong> running natively on <strong>iPhone, iPad, Mac (macOS), and Apple TV (tvOS)</strong> from a unified, high-performance codebase.</p>

      <h4>Key Deliverables &amp; Multi-Platform Engineering:</h4>
      <ul>
        <li><strong>Multi-Modal Input Abstraction Layer:</strong> Architected a hardware-agnostic input subsystem supporting seamless runtime hot-swapping between touchscreen touch/gestures (iPhone/iPad), wireless gamepads (MFi, Xbox, PlayStation controllers), Siri Remote gestures (Apple TV), and keyboard/mouse (Mac).</li>
        <li><strong>Responsive 4K Big-Screen TV &amp; Retina Scaling:</strong> Built an automated UI and rendering pipeline that dynamically reconfigures viewport layouts, camera projections, and asset mipmaps from handheld mobile screens up to crisp 4K 60FPS HDR displays on Apple TV.</li>
        <li><strong>CloudKit &amp; Game Center Cross-Progression:</strong> Universal iCloud save state replication enabling instant multi-device session continuity across devices.</li>
        <li><strong>Sub-Second Real-Time Synchronization:</strong> Low-latency client-server WebSocket event streams ensuring all concurrent players received trivia questions, countdown locks, and scoring answers in sync.</li>
      </ul>

      <h4>Telemetry &amp; Multi-Device Impact:</h4>
      <div class="quick-metrics-grid" style="margin-top: 16px;">
        <div class="metric-card"><span class="metric-val">4 PLATFORMS</span><span class="metric-desc">iPhone, iPad, Mac, Apple TV</span></div>
        <div class="metric-card"><span class="metric-val">60 FPS</span><span class="metric-desc">Target Locked Across All Screens</span></div>
        <div class="metric-card"><span class="metric-val">HOT-SWAP</span><span class="metric-desc">Gamepad / Touch / Siri Remote</span></div>
      </div>
    `
  },
  'bop-live': {
    title: 'Bop Live // Real-Time Social Audio &amp; Interactive Game Loops',
    company: 'Apra Technologies Private LTD • Bengaluru, India',
    role: 'Senior Game Developer (Unity / Real-Time Systems)',
    timeline: 'February 2019 - November 2019',
    stack: 'Unity 3D, C#, Real-Time Audio, WebSockets, Component Architecture, Live Ops',
    image: '',
    trailerUrl: '',
    content: `
      <h4>High-Concurrency Audio &amp; Live Game Loop Architecture:</h4>
      <p>Engineered core real-time multiplayer loops, synchronized audio cue pipelines, and low-latency interactive UI states for Bop Live under Apra Technologies Private LTD.</p>

      <h4>Key Technical Solutions:</h4>
      <ul>
        <li><strong>Sub-Second Real-Time Round Synchronization:</strong> Built high-concurrency client-server event streams over WebSockets ensuring all live participants received audio tracks, countdown locks, and scoring answers simultaneously.</li>
        <li><strong>Dynamic Audio Streaming &amp; UI States:</strong> Designed low-latency audio cue pipelines and responsive UI transitions reacting to live music tracks and rapid player scoring under heavy network traffic.</li>
        <li><strong>Resilient Networking Core:</strong> Created fault-tolerant event streams and state synchronizations for fast-paced social round turnarounds.</li>
      </ul>
    `
  }
};

// Backwards compatibility alias
projectData['project-titan'] = projectData['ecricket'];

function initProjectBlueprints() {
  const modal = document.getElementById('project-modal');
  const modalTitle = document.getElementById('modal-project-title');
  const modalContent = document.getElementById('modal-project-content');
  const closeBtn = document.getElementById('btn-close-modal');
  const dismissBtn = document.getElementById('btn-modal-dismiss');
  const inspectBtns = document.querySelectorAll('.btn-card-inspect');

  function openBlueprint(projectId) {
    const data = projectData[projectId];
    if (!data || !modal) return;

    modalTitle.textContent = data.title;

    // Optional media visual (only renders if valid image path exists)
    let mediaHtml = '';
    if (data.image && data.image.trim() !== '') {
      let thumbsHtml = '';
      if (data.screenshots && data.screenshots.length > 1) {
        thumbsHtml = `
          <div class="blueprint-thumbs-strip" style="display: flex; gap: 8px; margin-top: 8px; margin-bottom: 14px; overflow-x: auto; padding-bottom: 4px;">
            ${data.screenshots.map((s, idx) => `
              <button type="button" class="blueprint-thumb-btn ${idx === 0 ? 'active' : ''}" data-src="${s}" title="View capture ${idx + 1}" style="flex: 0 0 84px; height: 50px; border-radius: 4px; border: 1px solid ${idx === 0 ? 'var(--theme-accent)' : 'rgba(255,255,255,0.2)'}; padding: 0; background: #060b13; overflow: hidden; cursor: pointer; transition: all 0.2s ease;">
                <img src="${s}" alt="Thumbnail ${idx + 1}" style="width: 100%; height: 100%; object-fit: contain; background: #040810; display: block;">
              </button>
            `).join('')}
          </div>
        `;
      }

      mediaHtml = `
        <div class="blueprint-media-hero" style="margin-bottom: 12px; position: relative; border-radius: 4px; overflow: hidden; border: 1px solid rgba(0, 242, 254, 0.3); background: #040810; display: flex; align-items: center; justify-content: center; min-height: 220px;">
          <img id="blueprint-hero-image" src="${data.image}" alt="${data.title}" style="width: 100%; max-height: 480px; object-fit: contain; background: #040810; display: block; margin: 0 auto;" onerror="this.parentElement.style.display='none';">
          <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(10, 16, 26, 0.85); border: 1px solid rgba(0, 242, 254, 0.4); padding: 2px 8px; font-size: 0.7rem; font-family: var(--font-mono); color: var(--theme-accent);">GAMEPLAY CAPTURE</div>
        </div>
        ${thumbsHtml}
      `;
    }

    // Optional trailer video embed & button (only renders if valid YouTube / video link exists)
    let trailerHtml = '';
    if (data.trailerUrl && data.trailerUrl.trim() !== '') {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = data.trailerUrl.match(regExp);
      const ytId = (match && match[2].length === 11) ? match[2] : null;

      let videoEmbed = '';
      if (ytId) {
        videoEmbed = `
          <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 4px; border: 1px solid rgba(0, 242, 254, 0.4); margin-bottom: 12px; background: #000; box-shadow: 0 4px 20px rgba(0, 242, 254, 0.15);">
            <iframe src="https://www.youtube.com/embed/${ytId}?rel=0" title="${data.title} Trailer" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe>
          </div>
        `;
      }

      trailerHtml = `
        <div class="blueprint-trailer-dock" style="margin-top: 14px; margin-bottom: 16px;">
          ${videoEmbed}
          <div style="display: flex; justify-content: flex-end;">
            <a href="${data.trailerUrl}" target="_blank" rel="noopener noreferrer" class="btn hud-btn small" style="display: inline-flex; align-items: center; gap: 8px; background: rgba(220, 38, 38, 0.18); border: 1px solid rgba(239, 68, 68, 0.5); color: #fecaca; text-decoration: none;">
              <span style="color: #ef4444; font-size: 0.95rem;">▶</span>
              <span style="font-family: var(--font-tech); font-weight: 700; letter-spacing: 0.05em;">OPEN ON YOUTUBE</span>
              <span style="font-size: 0.75rem; opacity: 0.8;">↗</span>
            </a>
          </div>
        </div>
      `;
    }

    modalContent.innerHTML = `
      ${mediaHtml}
      <div style="margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
        <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--theme-accent);">${data.company} • ${data.timeline}</div>
        <div style="font-family: var(--font-tech); font-weight: 700; color: #ffffff; font-size: 1.05rem;">ROLE: ${data.role}</div>
        <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">TECH STACK: ${data.stack}</div>
      </div>
      ${trailerHtml}
      <div>${data.content}</div>
    `;

    // Hook up thumbnail clicks if gallery exists
    const heroImg = modalContent.querySelector('#blueprint-hero-image');
    const thumbBtns = modalContent.querySelectorAll('.blueprint-thumb-btn');
    if (heroImg && thumbBtns.length > 0) {
      thumbBtns.forEach(tBtn => {
        tBtn.addEventListener('click', () => {
          const newSrc = tBtn.getAttribute('data-src');
          if (newSrc) {
            heroImg.src = newSrc;
            thumbBtns.forEach(b => {
              b.style.borderColor = 'rgba(255,255,255,0.2)';
              b.style.boxShadow = 'none';
              b.classList.remove('active');
            });
            tBtn.style.borderColor = 'var(--theme-accent)';
            tBtn.style.boxShadow = '0 0 10px rgba(0, 242, 254, 0.4)';
            tBtn.classList.add('active');
            if (window.soundFX) window.soundFX.playClick();
          }
        });
      });
    }

    modal.hidden = false;
    modal.classList.add('active');
    modal.style.display = 'flex';
    if (window.soundFX) window.soundFX.playLaserChime();
  }

  function closeBlueprint() {
    if (modal) {
      modal.hidden = true;
      modal.classList.remove('active');
      modal.style.display = 'none';
      if (modalContent) modalContent.innerHTML = ''; // Stops iframe video/audio immediately
      if (window.soundFX) window.soundFX.playClick();
    }
  }

  // Make the entire project tile/card clickable to open technical specs blueprint
  const projectCards = document.querySelectorAll('.project-card');
  projectCards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Allow trailer links, carousel arrows, or any external anchors to function normally
      if (e.target.closest('.btn-card-trailer') || e.target.closest('.carousel-nav-btn') || e.target.closest('a[href]')) {
        return;
      }
      const projectId = card.dataset.id;
      if (projectId) {
        openBlueprint(projectId);
      }
    });
  });

  inspectBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openBlueprint(btn.dataset.project);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeBlueprint();
    });
  }

  if (dismissBtn) {
    dismissBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeBlueprint();
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) closeBlueprint();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.hidden) {
      closeBlueprint();
    }
  });
}

/**
 * Sync Project Media Cards and Trailer Links
 * If an image/trailer URL is provided in projectData, it renders cleanly;
 * if empty or absent, it is completely hidden with no empty boxes or dead buttons.
 */
function initProjectMediaAndTrailers() {
  Object.keys(projectData).forEach(projId => {
    const data = projectData[projId];
    if (!data) return;

    // Check media banner on project card
    const bannerEl = document.querySelector(`.card-media-banner[data-media-for="${projId}"]`);
    if (bannerEl) {
      const shots = (data.screenshots && data.screenshots.length > 0) ? data.screenshots : (data.image ? [data.image] : []);
      if (shots.length === 0) {
        bannerEl.style.display = 'none';
      } else if (shots.length === 1) {
        bannerEl.innerHTML = `
          <img src="${shots[0]}" alt="${data.title}" class="project-banner-img" loading="lazy" onerror="this.parentElement.style.display='none';">
          <div class="media-overlay-scanline"></div>
        `;
        bannerEl.style.display = 'block';
      } else {
        // Multi-image Carousel
        bannerEl.classList.add('is-carousel');
        bannerEl.innerHTML = `
          <div class="carousel-slides-container">
            ${shots.map((src, i) => `
              <div class="carousel-slide ${i === 0 ? 'active' : ''}" data-index="${i}">
                <img src="${src}" alt="${data.title} slide ${i + 1}" class="project-banner-img" loading="lazy">
              </div>
            `).join('')}
          </div>
          <div class="media-overlay-scanline"></div>
          <div class="carousel-counter-badge">01 / ${String(shots.length).padStart(2, '0')}</div>
          <button type="button" class="carousel-nav-btn prev" aria-label="Previous slide">‹</button>
          <button type="button" class="carousel-nav-btn next" aria-label="Next slide">›</button>
          <div class="carousel-pips">
            ${shots.map((_, i) => `
              <button type="button" class="carousel-pip ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Slide ${i + 1}"></button>
            `).join('')}
          </div>
        `;
        bannerEl.style.display = 'block';

        // Setup Carousel Logic
        let currentIndex = 0;
        const slides = bannerEl.querySelectorAll('.carousel-slide');
        const pips = bannerEl.querySelectorAll('.carousel-pip');
        const counter = bannerEl.querySelector('.carousel-counter-badge');
        const prevBtn = bannerEl.querySelector('.carousel-nav-btn.prev');
        const nextBtn = bannerEl.querySelector('.carousel-nav-btn.next');
        let autoplayTimer = null;

        function goToSlide(idx, playSfx = true) {
          if (idx < 0) idx = shots.length - 1;
          if (idx >= shots.length) idx = 0;
          currentIndex = idx;

          slides.forEach((s, i) => {
            if (i === currentIndex) s.classList.add('active');
            else s.classList.remove('active');
          });

          pips.forEach((p, i) => {
            if (i === currentIndex) p.classList.add('active');
            else p.classList.remove('active');
          });

          if (counter) {
            counter.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(shots.length).padStart(2, '0')}`;
          }

          if (playSfx && window.soundFX) window.soundFX.playClick();
        }

        function startAutoplay() {
          stopAutoplay();
          autoplayTimer = setInterval(() => {
            goToSlide(currentIndex + 1, false);
          }, 4200);
        }

        function stopAutoplay() {
          if (autoplayTimer) {
            clearInterval(autoplayTimer);
            autoplayTimer = null;
          }
        }

        if (prevBtn) {
          prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            goToSlide(currentIndex - 1);
            startAutoplay();
          });
        }

        if (nextBtn) {
          nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            goToSlide(currentIndex + 1);
            startAutoplay();
          });
        }

        pips.forEach(pip => {
          pip.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const targetIdx = parseInt(pip.getAttribute('data-index'), 10);
            goToSlide(targetIdx);
            startAutoplay();
          });
        });

        // Pause on hover so user can inspect slide
        bannerEl.addEventListener('mouseenter', stopAutoplay);
        bannerEl.addEventListener('mouseleave', startAutoplay);

        // Mobile touch swipe gestures
        let touchStartX = 0;
        let touchStartY = 0;
        bannerEl.addEventListener('touchstart', (e) => {
          if (e.touches && e.touches.length > 0) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
          }
        }, { passive: true });

        bannerEl.addEventListener('touchend', (e) => {
          if (e.changedTouches && e.changedTouches.length > 0) {
            const diffX = e.changedTouches[0].clientX - touchStartX;
            const diffY = e.changedTouches[0].clientY - touchStartY;
            // Only trigger if horizontal swipe is dominant and exceeds 35px
            if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
              if (diffX < 0) {
                goToSlide(currentIndex + 1); // Swiped left -> next
              } else {
                goToSlide(currentIndex - 1); // Swiped right -> prev
              }
              startAutoplay();
            }
          }
        }, { passive: true });

        // Start initial auto rotation
        startAutoplay();
      }
    }

    // Check trailer button on project card
    const trailerBtn = document.querySelector(`.btn-card-trailer[data-trailer-for="${projId}"]`);
    if (trailerBtn) {
      if (data.trailerUrl && data.trailerUrl.trim() !== '') {
        trailerBtn.href = data.trailerUrl;
        trailerBtn.style.display = 'inline-flex';
      } else {
        trailerBtn.style.display = 'none';
      }
    }
  });
}

/* ==========================================================================
   7. TDD RESUME SPEC MODAL (PRINT READY & COMPLETE RESUME)
   ========================================================================== */
function initResumeModal() {
  const modal = document.getElementById('resume-modal');
  const openBtn = document.getElementById('btn-quick-resume');
  const closeBtn = document.getElementById('btn-close-resume-modal');
  const printBtn = document.getElementById('btn-print-resume');
  const contentEl = document.getElementById('resume-modal-content');

  if (!modal || !contentEl) return;

  function openResume() {
    modal.hidden = false;
    modal.classList.add('active');
    modal.style.display = 'flex';
    if (window.soundFX) window.soundFX.playLaserChime();
  }

  function closeResume() {
    modal.hidden = true;
    modal.classList.remove('active');
    modal.style.display = 'none';
    if (window.soundFX) window.soundFX.playClick();
  }

  // Build clean, high-density structured TDD resume sheet
  contentEl.innerHTML = `
    <div style="border-bottom: 2px solid var(--theme-accent); padding-bottom: 16px; margin-bottom: 20px;">
      <h2 style="font-size: 2.2rem; color: #ffffff; margin-bottom: 4px;">MAYANK MANJUL</h2>
      <h3 style="font-size: 1.15rem; color: var(--theme-accent); margin-bottom: 8px;">
        Principal Gameplay Engineer • Lead Game Developer | Unreal Engine 5 (Modern C++) | Unity
      </h3>
      <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-secondary); display: flex; flex-wrap: wrap; gap: 16px;">
        <span>📍 Bengaluru, Karnataka, India</span>
        <span>✉ mayankmanjul@live.com</span>
        <span>📞 +91-7066845227</span>
        <span>🔗 linkedin.com/in/mayankmanjul</span>
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <h4 style="font-size: 1.1rem; color: var(--theme-accent); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 8px;">EXECUTIVE SUMMARY</h4>
      <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-primary);">
        Lead Game Developer and Principal Gameplay Engineer with <strong>12+ years of battle-tested experience</strong> architecting high-performance runtime systems and large-scale gameplay frameworks across PC, console (Xbox), and mobile platforms. Specialized in modern C++ (C++17/20) within Unreal Engine 5 alongside a strong foundation in enterprise-scale Unity development. My work sits at the intersection of low-level systems engineering and visceral game feel: modular StateTree architectures, decoupled locomotion, server-authoritative replication, and hitch-free performance profiling with Unreal Insights. Founder of <em>Unity Developers India</em>.
      </p>
    </div>

    <div style="margin-bottom: 20px;">
      <h4 style="font-size: 1.1rem; color: var(--theme-accent); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 8px;">CORE TECHNICAL COMPETENCIES</h4>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-family: var(--font-mono); font-size: 0.85rem;">
        <div><strong>Game Engines:</strong> Unreal Engine 5 (UE5), UE4, Unity (3D/2D), Box2D</div>
        <div><strong>Languages:</strong> Modern C++ (C++17/20), C#, JavaScript, TypeScript</div>
        <div><strong>Gameplay Architecture:</strong> StateTree, Gameplay Tags, Zenject IoC, Locomotion</div>
        <div><strong>Multiplayer &amp; Netcode:</strong> Server Authority, Client Prediction, Photon, Sockets</div>
        <div><strong>Profiling &amp; Optimization:</strong> Unreal Insights, Tick Budgets, Memory Profiling</div>
        <div><strong>Platforms &amp; Tools:</strong> Windows, Xbox Console, iOS/Android, Perforce (P4), Git</div>
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <h4 style="font-size: 1.1rem; color: var(--theme-accent); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 8px;">PROFESSIONAL EXPERIENCE RECORD</h4>
      
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-weight: 700; color: #ffffff;">
          <span>LIGHTFURY GAMES — Senior Gameplay Programmer Level 4 (Principal Engineer)</span>
          <span style="font-family: var(--font-mono); color: var(--theme-accent);">July 2026 – Present</span>
        </div>
        <p style="font-size: 0.9rem; margin-top: 4px;">Flagship UE5 production title: <em>ECricket</em>. Spearheaded core gameplay architecture and decoupled locomotion refactoring. Authored studio-wide TDD/ECRICKET-7884 governance, defined tick/memory budgets, led cross-discipline reviews, and mentored engineering pods.</p>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-weight: 700; color: #ffffff;">
          <span>LIGHTFURY GAMES — Senior Gameplay Programmer 3</span>
          <span style="font-family: var(--font-mono); color: var(--theme-accent);">May 2024 – July 2026</span>
        </div>
        <p style="font-size: 0.9rem; margin-top: 4px;">Engineered modular StateTree and gameplay tag architectures; integrated server-authoritative replication with smooth client prediction; conducted deep Unreal Insights profiling eliminating frame hitches.</p>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-weight: 700; color: #ffffff;">
          <span>M56 TECHNOLOGIES PVT LTD — Lead Game Developer</span>
          <span style="font-family: var(--font-mono); color: var(--theme-accent);">January 2023 – May 2024</span>
        </div>
        <p style="font-size: 0.9rem; margin-top: 4px;">Directed architecture for real-time multiplayer titles and the <strong>Apple Arcade</strong> release of <strong>Hanx Trivia</strong> (partnered with Tom Hanks) across iPhone, iPad, Mac, and Apple TV. Decoupled game loops using Zenject IoC; mentored pod of 8+ developers; established low-latency client-server socket pipelines.</p>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-weight: 700; color: #ffffff;">
          <span>BYJU'S — Lead Engineer (Unity) • [Employee of the Year 2021-2022]</span>
          <span style="font-family: var(--font-mono); color: var(--theme-accent);">January 2021 – January 2023</span>
        </div>
        <p style="font-size: 0.9rem; margin-top: 4px;">Technical Lead for <em>Disney • BYJU'S Early Learn</em> (millions of users). Architected dynamic asset delivery pipelines reducing initial app size by >35%. Defined performance budgets across low-to-high end devices.</p>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-weight: 700; color: #ffffff;">
          <span>JETSYNTHESYS PVT LTD — Senior Game Developer (Unity)</span>
          <span style="font-family: var(--font-mono); color: var(--theme-accent);">July 2017 – February 2019</span>
        </div>
        <p style="font-size: 0.9rem; margin-top: 4px;">Core contributor for chart-topping <em>Sachin Saga Cricket Champions</em>. Architected physics-driven ball trajectory calculations, batting timing mechanics, fielding AI, and ragdoll blend transitions.</p>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-weight: 700; color: #ffffff;">
          <span>APRA TECHNOLOGIES PRIVATE LTD — Senior Game Developer (Unity)</span>
          <span style="font-family: var(--font-mono); color: var(--theme-accent);">February 2019 – November 2019</span>
        </div>
        <p style="font-size: 0.9rem; margin-top: 4px;">Engineered high-concurrency real-time multiplayer loops, sub-second event synchronization, and dynamic audio cue pipelines for live social title <em>Bop Live</em>.</p>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-weight: 700; color: #ffffff;">
          <span>AQUIMO SPORTS LLC — Senior Game Developer (Unity)</span>
          <span style="font-family: var(--font-mono); color: var(--theme-accent);">January 2016 – July 2017</span>
        </div>
        <p style="font-size: 0.9rem; margin-top: 4px;">Engineered live interactive sports and entertainment gaming loops with sub-second multi-client round sync and WebSocket infrastructure.</p>
      </div>
    </div>

    <div>
      <h4 style="font-size: 1.1rem; color: var(--theme-accent); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 8px;">EDUCATION &amp; HONORS</h4>
      <div style="font-size: 0.9rem;">
        <p><strong>Bachelor of Arts (BA) in Game Development — Grade A</strong> • University of Wales, Cardiff, UK (2009 – 2012)</p>
        <p><strong>BYJU'S Employee of the Year Award</strong> (2021 – 2022) for Engineering &amp; Architectural Excellence</p>
        <p><strong>Founder &amp; Guild Master:</strong> <em>Unity Developers India</em> (Nationwide developer guild)</p>
      </div>
    </div>
  `;

  if (openBtn) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openResume();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeResume();
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      closeResume();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.hidden) {
      closeResume();
    }
  });
}

/* ==========================================================================
   8. CONTACT FORM TRANSMISSION & CLIPBOARD
   ========================================================================== */
function initContactSystem() {
  const form = document.getElementById('contact-form');
  const packetStatus = document.getElementById('form-packet-status');
  const copyButtons = document.querySelectorAll('.btn-copy');

  // Copy to clipboard
  copyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const val = btn.dataset.copy;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(val).then(() => {
          const original = btn.textContent;
          btn.textContent = 'COPIED!';
          btn.style.background = 'var(--accent-emerald)';
          btn.style.color = '#000000';
          if (window.soundFX) window.soundFX.playLaserChime();
          setTimeout(() => {
            btn.textContent = original;
            btn.style.background = '';
            btn.style.color = '';
          }, 2000);
        });
      }
    });
  });

  // Simulated transmission dispatch
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const sender = document.getElementById('form-sender').value;
      const email = document.getElementById('form-email').value;
      const subject = document.getElementById('form-subject').value;
      const message = document.getElementById('form-message').value;

      if (packetStatus) {
        packetStatus.textContent = 'ENCRYPTING & DISPATCHING...';
        packetStatus.style.color = 'var(--accent-amber)';
      }

      if (window.soundFX) window.soundFX.playLaunchSound();

      setTimeout(() => {
        if (packetStatus) {
          packetStatus.textContent = 'TRANSMISSION SENT SUCCESSFULLY!';
          packetStatus.style.color = 'var(--accent-emerald)';
        }

        // Open mailto fallback so user can actually deliver their email client if preferred
        const mailtoUri = `mailto:mayankmanjul@live.com?subject=${encodeURIComponent('[PORTFOLIO INQUIRY] ' + subject + ' from ' + sender)}&body=${encodeURIComponent(message + '\n\nSender Email: ' + email)}`;
        window.location.href = mailtoUri;

        form.reset();
        if (window.soundFX) window.soundFX.playLaserChime();
      }, 900);
    });
  }
}

/* ==========================================================================
   9. HOVER AUDIO FEEDBACK HOOKS
   ========================================================================== */
function initSoundHooks() {
  const hoverElements = document.querySelectorAll('.hud-btn, .nav-item, .project-card, .filter-btn, .node-state-btn, .contact-item-card, .hud-control-btn');
  hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (window.soundFX) window.soundFX.playBlip(900, 0.02);
    });
  });
}

/* ==========================================================================
   10. CUSTOM HUD CYBERPUNK DROPDOWNS (ZERO NATIVE OS DIALOGS)
   ========================================================================== */
function initCustomSelects() {
  const selects = document.querySelectorAll('select.hud-select');
  selects.forEach(select => {
    if (select.dataset.customized === 'true') return;
    select.dataset.customized = 'true';

    // Hide native select visually while keeping it in DOM for forms/listeners
    select.classList.add('hud-native-select-hidden');

    // Create custom wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'hud-custom-select';
    wrapper.setAttribute('data-target-select', select.id || '');

    // Create trigger button
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'hud-custom-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const selectedOption = select.options[select.selectedIndex] || select.options[0];
    const labelSpan = document.createElement('span');
    labelSpan.className = 'hud-custom-select-label';
    labelSpan.innerHTML = selectedOption ? selectedOption.innerHTML : 'Select option';

    const chevronSpan = document.createElement('span');
    chevronSpan.className = 'hud-custom-select-chevron';
    chevronSpan.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

    trigger.appendChild(labelSpan);
    trigger.appendChild(chevronSpan);
    wrapper.appendChild(trigger);

    // Create options menu
    const menu = document.createElement('div');
    menu.className = 'hud-custom-select-menu';
    menu.setAttribute('role', 'listbox');

    Array.from(select.options).forEach((opt, idx) => {
      const optEl = document.createElement('div');
      optEl.className = 'hud-custom-select-option' + (idx === select.selectedIndex ? ' active' : '');
      optEl.setAttribute('role', 'option');
      optEl.setAttribute('data-value', opt.value);
      optEl.setAttribute('aria-selected', idx === select.selectedIndex ? 'true' : 'false');

      const bullet = document.createElement('span');
      bullet.className = 'opt-bullet';

      const text = document.createElement('span');
      text.className = 'opt-text';
      text.innerHTML = opt.innerHTML;

      optEl.appendChild(bullet);
      optEl.appendChild(text);

      optEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (select.value !== opt.value) {
          select.value = opt.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
        updateCustomSelectUI(wrapper, select);
        closeAllCustomSelects();
        if (window.soundFX) window.soundFX.playClick();
      });

      menu.appendChild(optEl);
    });

    wrapper.appendChild(menu);

    // Insert wrapper right after select in DOM
    select.parentNode.insertBefore(wrapper, select.nextSibling);

    // Toggle menu
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = wrapper.classList.contains('is-open');
      closeAllCustomSelects();
      if (!isOpen) {
        wrapper.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        if (window.soundFX) window.soundFX.playBlip(750, 0.02);
      }
    });

    // Sync if select value changes programmatically
    select.addEventListener('change', () => {
      updateCustomSelectUI(wrapper, select);
    });
  });

  // Global close on outside click or escape
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.hud-custom-select')) {
      closeAllCustomSelects();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllCustomSelects();
    }
  });
}

function updateCustomSelectUI(wrapper, select) {
  const triggerLabel = wrapper.querySelector('.hud-custom-select-label');
  const selectedOpt = select.options[select.selectedIndex];
  if (triggerLabel && selectedOpt) {
    triggerLabel.innerHTML = selectedOpt.innerHTML;
  }
  const optionEls = wrapper.querySelectorAll('.hud-custom-select-option');
  optionEls.forEach(optEl => {
    const isSelected = optEl.dataset.value === select.value;
    optEl.classList.toggle('active', isSelected);
    optEl.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  });
}

function closeAllCustomSelects() {
  document.querySelectorAll('.hud-custom-select.is-open').forEach(w => {
    w.classList.remove('is-open');
    const trig = w.querySelector('.hud-custom-select-trigger');
    if (trig) trig.setAttribute('aria-expanded', 'false');
  });
}

window.initCustomSelects = initCustomSelects;
