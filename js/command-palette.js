/**
 * NEXUS ENTERPRISE ERP — GLOBAL COMMAND PALETTE (Ctrl+K / ⌘K)
 * Instant Search & Keyboard Navigation across Modules, Microservices, ADRs & Tools
 */

document.addEventListener('DOMContentLoaded', () => {
  initCommandPalette();
});

function initCommandPalette() {
  const modal = document.getElementById('cmd-palette-modal');
  const triggerBtns = document.querySelectorAll('.cmd-palette-btn');
  const input = document.getElementById('cmd-search-input');
  const resultsContainer = document.getElementById('cmd-results-list');
  if (!modal || !input || !resultsContainer) return;

  const searchItems = [
    { title: 'FM-03 General Ledger & Accounting', category: 'Business Module', desc: 'Double-entry journal engine, append-only ledger, real-time Trial Balance', link: '#modules', action: () => switchModuleTab('accounting') },
    { title: 'FM-04 Inventory & Multi-Warehouse', category: 'Business Module', desc: 'FIFO valuation layers, sub-300ms availability check, batch tracking', link: '#modules', action: () => switchModuleTab('inventory') },
    { title: 'FM-05 Purchasing & 3-Way Match', category: 'Business Module', desc: 'PO vs GRN vs Vendor Bill automated matching engine & variance queue', link: '#modules', action: () => switchModuleTab('purchasing') },
    { title: 'FM-06 & FM-07 CRM & Sales Order-to-Cash', category: 'Business Module', desc: 'Opportunity Kanban, credit limit check, gapless invoice numbering', link: '#modules', action: () => switchModuleTab('sales') },
    { title: 'FM-08 & FM-09 HR & Global Payroll Engine', category: 'Business Module', desc: 'Sandboxed formula trace, statutory compliance rule packs, leave balance', link: '#modules', action: () => switchModuleTab('payroll') },
    { title: 'FM-01 Multi-Tenancy & Row-Level Security', category: 'Security & Data', desc: 'Postgres RLS session variables, zero cross-tenant leakage proof', link: '#modules', action: () => switchModuleTab('tenancy') },
    { title: 'ADR-001 Service Decomposition', category: 'Architecture Decision', desc: 'Right-sized services aligned to DDD bounded contexts without distributed monolith', link: '#architecture', action: () => openAdrModal('ADR-001') },
    { title: 'ADR-002 Pooled Shared-Schema Tenancy', category: 'Architecture Decision', desc: 'Tenant isolation with Postgres RLS, promotion to dedicated clusters with zero code change', link: '#architecture', action: () => openAdrModal('ADR-002') },
    { title: 'ADR-005 Kafka Event Backbone', category: 'Architecture Decision', desc: 'Single event backbone with JSON Schema Registry, 30-day retention and replay', link: '#architecture', action: () => openAdrModal('ADR-005') },
    { title: 'ADR-006 Transactional Outbox Pattern', category: 'Architecture Decision', desc: 'At-least-once delivery, idempotent consumer tables, zero dual-write bugs', link: '#architecture', action: () => openAdrModal('ADR-006') },
    { title: 'ADR-007 Temporal Saga Orchestration', category: 'Architecture Decision', desc: 'Durable distributed transactions with automatic business-level compensation', link: '#saga-simulator', action: () => scrollToSection('#saga-simulator') },
    { title: 'ADR-009 Accounting Owns the GL', category: 'Architecture Decision', desc: 'Sole owner of the ledger, versioned idempotent posting contract from all modules', link: '#architecture', action: () => openAdrModal('ADR-009') },
    { title: 'ADR-014 AI Tier with Permission-Scoped Access', category: 'Architecture Decision', desc: 'LangGraph Python service, pgvector, OAuth token exchange, zero autonomous posting', link: '#ai-tier', action: () => scrollToSection('#ai-tier') },
    { title: 'Temporal Saga Resilience Simulator', category: 'Interactive Tool', desc: 'Interactive step-by-step O2C execution with simulated failure & compensation', link: '#saga-simulator', action: () => scrollToSection('#saga-simulator') },
    { title: 'Enterprise ROI & TCO Calculator', category: 'Interactive Tool', desc: 'Simulate annual savings, days to financial close, and touchless invoice ROI', link: '#roi-calculator', action: () => scrollToSection('#roi-calculator') },
    { title: 'Schedule Architecture Review', category: 'Executive Demo', desc: 'Book a 1-on-1 architecture deep dive with our Chief Enterprise Architect', link: '#', action: () => openDemoModal() }
  ];

  function openPalette() {
    modal.classList.add('open');
    input.value = '';
    renderResults(searchItems);
    setTimeout(() => input.focus(), 50);
  }

  function closePalette() {
    modal.classList.remove('open');
  }

  triggerBtns.forEach(btn => btn.addEventListener('click', openPalette));

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('modal-close-btn')) {
      closePalette();
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (modal.classList.contains('open')) {
        closePalette();
      } else {
        openPalette();
      }
    }
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closePalette();
    }
  });

  input.addEventListener('input', () => {
    const query = input.value.toLowerCase().trim();
    if (!query) {
      renderResults(searchItems);
      return;
    }
    const filtered = searchItems.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.category.toLowerCase().includes(query) || 
      item.desc.toLowerCase().includes(query)
    );
    renderResults(filtered);
  });

  function renderResults(items) {
    if (!items.length) {
      resultsContainer.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
          No matching modules or architecture decisions found.
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = items.map((item, index) => `
      <div class="cmd-item" data-index="${index}" style="
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: background var(--transition-fast);
        border-bottom: 1px solid var(--border-subtle);
      ">
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-main);">${item.title}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${item.desc}</div>
        </div>
        <span class="badge badge-info" style="font-size: 0.7rem;">${item.category}</span>
      </div>
    `).join('');

    resultsContainer.querySelectorAll('.cmd-item').forEach((row, i) => {
      row.addEventListener('click', () => {
        closePalette();
        if (items[i].action) items[i].action();
      });
      row.addEventListener('mouseenter', () => {
        row.style.background = 'rgba(255, 255, 255, 0.05)';
      });
      row.addEventListener('mouseleave', () => {
        row.style.background = 'transparent';
      });
    });
  }
}

function switchModuleTab(moduleKey) {
  const targetBtn = document.querySelector(`.module-nav-item[data-module="${moduleKey}"]`);
  if (targetBtn) targetBtn.click();
  const modSection = document.getElementById('modules');
  if (modSection) modSection.scrollIntoView({ behavior: 'smooth' });
}

function scrollToSection(selector) {
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}
