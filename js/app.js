/**
 * NEXUS ENTERPRISE ERP — MAIN APPLICATION SCRIPT
 * Theme Engine, Particle Mesh, Header Scroll, Persona Switcher, FAQ Accordion, Metrics Ticker
 */

window.API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  initThemeEngine();
  initHeaderScroll();
  initParticleMesh();
  initMetricsCounter();
  initHeroCockpitSwitcher();
  initPersonaSwitcher();
  initFaqAccordion();
  initMobileMenu();
  initSmoothScroll();
});

/* Theme Engine (Dark/Light Mode) */
function initThemeEngine() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('nexus_erp_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('nexus_erp_theme', newTheme);
      updateThemeIcon(newTheme);
    });
  }
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (!icon) return;
  if (theme === 'light') {
    icon.innerHTML = `<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else {
    icon.innerHTML = `<path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
}

/* Header Scroll Glass Effect */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

/* Cybernetic Particle Mesh Canvas */
function initParticleMesh() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = Math.min(Math.floor(width / 22), 65);

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.6 + 0.8,
      color: i % 2 === 0 ? 'rgba(6, 182, 212, 0.4)' : 'rgba(99, 102, 241, 0.4)'
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.12 * (1 - dist / 130)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

/* Metric Counter on Intersection */
function initMetricsCounter() {
  const metricElements = document.querySelectorAll('[data-target-value]');
  if (!metricElements.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-target-value'));
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        let start = 0;
        const duration = 1800;
        const startTime = performance.now();

        function animate(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          const current = start + (target - start) * easeProgress;
          el.textContent = `${prefix}${current.toFixed(decimals)}${suffix}`;

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
          }
        }
        requestAnimationFrame(animate);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.2 });

  metricElements.forEach(el => observer.observe(el));
}

/* Hero Cockpit Interactive Pill Switcher */
function initHeroCockpitSwitcher() {
  const pillButtons = document.querySelectorAll('.cockpit-pill-btn');
  const feedRows = document.getElementById('cockpit-feed-content');
  if (!pillButtons.length || !feedRows) return;

  const feeds = {
    gl: [
      { entity: 'JOURNAL #JE-2026-0041', detail: 'Dr Accounts Receivable $125,000 / Cr Sales Revenue $125,000', status: 'POSTED (GAPLESS)', type: 'success' },
      { entity: 'TRIAL BALANCE RECON', detail: 'All 842 accounts balanced across USD & EUR currencies', status: 'BALANCED', type: 'info' }
    ],
    inventory: [
      { entity: 'STOCK MOVE #MV-9021', detail: 'Goods Issue: 450 Units Item #SKU-990 (Central Warehouse)', status: 'FIFO LAYER CONSUMED', type: 'info' },
      { entity: 'GLOBAL AVAILABILITY', detail: 'Warehouse Central: 8,420 On-Hand / 1,200 Reserved', status: 'SUB-300MS CACHED', type: 'success' }
    ],
    saga: [
      { entity: 'TEMPORAL O2C SAGA', detail: 'ReserveStock -> IssueGoods -> CreateInvoice -> PostGL', status: 'EXECUTING STEP 4/4', type: 'purple' },
      { entity: 'OUTBOX EVENT BUS', detail: 'Published erp.sales.invoice.issued.v1 to Kafka MSK', status: 'ACKNOWLEDGED', type: 'success' }
    ],
    ai: [
      { entity: 'AI FINANCIAL AUDITOR', detail: 'Scan completed: 0 posting exceptions in period 2026-08', status: 'ANOMALY CLEAN', type: 'success' },
      { entity: 'VARIANCE PREDICTION', detail: 'Forecasted FX gain on pending EUR collections: +$4,210', status: 'EXPLAINABLE TRACE', type: 'info' }
    ]
  };

  pillButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      pillButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const feedKey = btn.getAttribute('data-feed') || 'gl';
      renderFeed(feeds[feedKey] || feeds.gl);
    });
  });

  function renderFeed(items) {
    feedRows.innerHTML = items.map(item => `
      <div class="feed-row">
        <div>
          <span class="feed-entity">${item.entity}</span>
          <div style="font-size: 0.78rem; color: var(--text-muted);">${item.detail}</div>
        </div>
        <span class="badge badge-${item.type}">${item.status}</span>
      </div>
    `).join('');
  }
}

/* Solutions by Executive Persona & Industry Switcher (NetSuite / Unit4 Style) */
function initPersonaSwitcher() {
  const personaButtons = document.querySelectorAll('.persona-btn');
  const displayContainer = document.getElementById('persona-content-display');
  if (!personaButtons.length || !displayContainer) return;

  const personas = {
    cfo: {
      title: 'For Chief Financial Officers & Controllers',
      tagline: 'Continuous Accounting with Zero-Variance Audit Defense',
      description: 'Replace traumatic 14-day month-end close panics with an append-only, immutable General Ledger. Gain instant multi-entity consolidation, automatic FX revaluation, and touchless 3-way matching.',
      metrics: [
        { label: 'Close Cycle Reduction', val: '14 Days ➔ 2 Days' },
        { label: 'Subledger–GL Variance', val: '0 (Automated Reconcile)' },
        { label: 'Audit Prep Effort', val: '-75% Time Saved' }
      ],
      capabilities: [
        'Immutable double-entry ledger with gapless sequence guarantees',
        'Automatic realized & unrealized FX gain/loss on multi-currency settlements',
        'Built-in subledger to control account continuous reconciliation'
      ]
    },
    ops: {
      title: 'For Supply Chain, Warehouse & Ops Leaders',
      tagline: 'Sub-300ms Stock Availability & Precision FIFO Valuation',
      description: 'Operate global multi-warehouse operations with real-time stock reservations, automated batch/expiry tracking, and touchless 3-way match purchase orders.',
      metrics: [
        { label: 'Availability Check Latency', val: '<300ms (Redis Cached)' },
        { label: 'Touchless PO Matching', val: '88.5% Auto-Approved' },
        { label: 'Stockout Incidence', val: '-92% Reduction' }
      ],
      capabilities: [
        'FIFO layers and weighted-average costing locked at database kernel level',
        'Row-level locking on stock movements preventing concurrent reservation races',
        'Barcode scan-ready mobile interface for receiving, picking, and cyclic counts'
      ]
    },
    cto: {
      title: 'For Chief Architects, CTOs & Engineering Leads',
      tagline: 'Distributed Domain-Driven Architecture with Zero-Monolith Decay',
      description: 'Say goodbye to fragile monolithic ERP upgrades. NEXUS is built on 16 decoupled NestJS/Node microservices, PostgreSQL Row-Level Security, Kafka event streaming, and Temporal durable sagas.',
      metrics: [
        { label: 'Cross-Tenant Leakage', val: '0 (Forced Kernel RLS)' },
        { label: 'Schema Upgrade Downtime', val: '0 (Expand/Contract)' },
        { label: 'Event Retention', val: '30 Days Durable Replay' }
      ],
      capabilities: [
        'Clean Architecture enforced in CI via dependency-cruiser rules',
        'Temporal distributed sagas with automatic business-level compensations',
        'Isolated Python/LangGraph AI tier executing under user OAuth token exchange'
      ]
    },
    hr: {
      title: 'For Global HR Directors & Payroll Officers',
      tagline: 'Effective-Dated Workforce Records & Explainable Payroll',
      description: 'Manage complex global salary structures and statutory rule packs with sandboxed formula evaluations. Every single payslip line stores a complete explainable calculation trace.',
      metrics: [
        { label: 'Payroll Dispute Resolution', val: '<2 Mins (1-Screen Trace)' },
        { label: 'Statutory Compliance', val: '100% Effective-Dated' },
        { label: 'Self-Service Adoption', val: '94% Mobile Active' }
      ],
      capabilities: [
        'Non-overlapping effective employment records enforced with PostgreSQL GIST',
        'Sandboxed formula calculation engine eliminating payroll black-box errors',
        'Field-level KMS envelope encryption and GDPR crypto-shredding compliance'
      ]
    }
  };

  personaButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      personaButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.getAttribute('data-persona') || 'cfo';
      renderPersona(personas[key] || personas.cfo);
    });
  });

  function renderPersona(data) {
    displayContainer.innerHTML = `
      <div class="glass-panel" style="padding: 36px; display: flex; flex-direction: column; gap: 20px;">
        <div>
          <span class="badge badge-info font-mono">${data.tagline}</span>
          <h3 style="font-size: 1.6rem; margin-top: 10px;">${data.title}</h3>
          <p style="margin-top: 10px; color: var(--text-muted); line-height: 1.6;">${data.description}</p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px; border-top: 1px solid var(--border-subtle); padding-top: 16px;">
          ${data.capabilities.map(cap => `
            <div style="display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: var(--text-main);">
              <span style="color: var(--accent-cyan); font-weight: 700;">✓</span>
              <span>${cap}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${data.metrics.map(m => `
          <div class="glass-panel" style="padding: 24px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 0.85rem; color: var(--text-muted);">${m.label}</div>
              <div class="font-mono" style="font-size: 1.6rem; font-weight: 800; color: var(--accent-emerald); margin-top: 4px;">${m.val}</div>
            </div>
            <div style="width: 42px; height: 42px; border-radius: 50%; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); display: flex; align-items: center; justify-content: center; color: var(--accent-emerald);">
              ↗
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Render initial
  renderPersona(personas.cfo);
}

/* Interactive FAQ Accordion */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        faqItems.forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    }
  });
}

/* Mobile Menu */
function initMobileMenu() {
  const toggle = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    menu.classList.toggle('mobile-open');
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('mobile-open');
    });
  });
}

/* Smooth Scrolling Navigation */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}
