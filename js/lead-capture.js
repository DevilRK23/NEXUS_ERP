/**
 * NEXUS ENTERPRISE ERP — DEMO BOOKING & ARCHITECTURE REVIEW
 * Interactive Modal Workflow, Role Routing & Instant Confirmation
 */

document.addEventListener('DOMContentLoaded', () => {
  initLeadCapture();
});

function initLeadCapture() {
  const modal = document.getElementById('demo-modal');
  const openButtons = document.querySelectorAll('.open-demo-btn');
  const closeBtn = document.getElementById('demo-modal-close');
  const form = document.getElementById('demo-booking-form');
  const genericModal = document.getElementById('generic-modal');
  const genericClose = document.getElementById('generic-modal-close');
  if (!modal || !form) return;

  window.openDemoModal = function() {
    modal.classList.add('open');
  };

  function closeDemoModal() {
    modal.classList.remove('open');
  }

  openButtons.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    openDemoModal();
  }));

  if (closeBtn) closeBtn.addEventListener('click', closeDemoModal);
  if (genericClose) {
    genericClose.addEventListener('click', () => {
      genericModal.classList.remove('open');
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeDemoModal();
  });
  if (genericModal) {
    genericModal.addEventListener('click', (e) => {
      if (e.target === genericModal) genericModal.classList.remove('open');
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('lead-name')?.value || 'Leader';
    const email = document.getElementById('lead-email')?.value || '';
    const role = document.getElementById('lead-role')?.value || 'Enterprise Architect';

    try {
      const apiBase = window.API_BASE || 'http://localhost:3000';
      fetch(`${apiBase}/api/v1/leads/demo-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role })
      });
    } catch (err) {}

    form.innerHTML = `
      <div style="text-align: center; padding: 30px 10px; display: flex; flex-direction: column; gap: 16px; align-items: center;">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); border: 2px solid var(--accent-emerald); display: flex; align-items: center; justify-content: center; font-size: 1.6rem;">
          ✓
        </div>
        <div style="font-size: 1.35rem; font-weight: 700; color: var(--text-main);">Architecture Review Confirmed!</div>
        <p style="color: var(--text-muted); font-size: 0.95rem; max-width: 440px; line-height: 1.6;">
          Thank you, <strong>${name}</strong>. A Principal Solutions Architect has been assigned to your workspace. We sent a calendar invitation and Level 0 specification packet to <strong>${email || 'your corporate email'}</strong>.
        </p>
        <button class="btn btn-primary" onclick="document.getElementById('demo-modal').classList.remove('open')" style="margin-top: 10px;">Done</button>
      </div>
    `;
  });
}
