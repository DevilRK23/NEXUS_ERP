/**
 * NEXUS ENTERPRISE ERP — TEMPORAL SAGA RESILIENCE SIMULATOR
 * Interactive Step-by-Step Distributed Transaction & Business Compensation Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initSagaSimulator();
});

function initSagaSimulator() {
  const btnHappy = document.getElementById('saga-btn-happy');
  const btnShortage = document.getElementById('saga-btn-shortage');
  const btnCompensate = document.getElementById('saga-btn-compensate');
  const eventStream = document.getElementById('saga-event-stream');
  const statusBadge = document.getElementById('saga-status-badge');
  const timelineSteps = document.querySelectorAll('.saga-step-card');
  if (!btnHappy || !btnCompensate || !eventStream) return;

  let isRunning = false;

  function resetSaga() {
    timelineSteps.forEach(step => {
      step.className = 'saga-step-card';
      const statusEl = step.querySelector('.saga-step-status');
      if (statusEl) statusEl.textContent = 'PENDING';
      const badgeEl = step.querySelector('.badge');
      if (badgeEl) {
        badgeEl.className = 'badge badge-info';
        badgeEl.textContent = 'WAITING';
      }
    });
    if (statusBadge) {
      statusBadge.className = 'badge badge-info';
      statusBadge.textContent = 'READY';
    }
  }

  function logEvent(text, isError = false) {
    const time = new Date().toISOString().substring(11, 19);
    const row = document.createElement('div');
    row.className = `event-stream-row ${isError ? 'error' : ''}`;
    row.innerHTML = `
      <span>[${time}] ${text}</span>
      <span class="badge ${isError ? 'badge-danger' : 'badge-purple'}" style="font-size: 0.65rem;">
        ${isError ? 'ROLLBACK' : 'EVENT OUTBOX'}
      </span>
    `;
    eventStream.prepend(row);
  }

  async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function executeStep(stepIndex, title, eventName, isCompensate = false) {
    const step = timelineSteps[stepIndex];
    if (!step) return;

    if (!isCompensate) {
      step.classList.add('running');
      const badge = step.querySelector('.badge');
      if (badge) {
        badge.className = 'badge badge-warning';
        badge.textContent = 'RUNNING';
      }
      await sleep(800);
      step.classList.remove('running');
      step.classList.add('completed');
      if (badge) {
        badge.className = 'badge badge-success';
        badge.textContent = 'COMPLETED';
      }
      logEvent(`Published to Kafka: ${eventName}`);
    } else {
      step.classList.remove('completed');
      step.classList.add('compensated');
      const badge = step.querySelector('.badge');
      if (badge) {
        badge.className = 'badge badge-danger';
        badge.textContent = 'COMPENSATED';
      }
      logEvent(`Compensation Executed: ${eventName}`, true);
      await sleep(600);
    }
  }

  /* 1. Happy Path Simulation */
  btnHappy.addEventListener('click', async () => {
    if (isRunning) return;
    isRunning = true;
    resetSaga();
    if (statusBadge) {
      statusBadge.className = 'badge badge-warning';
      statusBadge.textContent = 'EXECUTING SAGA';
    }
    logEvent('Temporal Workflow Started: orderToCashWorkflow(orderId="SO-2026-9041")');

    // Notify backend
    try {
      const apiBase = window.API_BASE || 'http://localhost:3000';
      fetch(`${apiBase}/api/v1/workflows/o2c/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sagaType: 'ORDER_TO_CASH', orderId: 'SO-2026-9041' })
      });
    } catch(e) {}

    // Step 1: Stock Reservation
    await executeStep(0, 'Reserve Stock', 'erp.inventory.stock.reserved.v1');
    // Step 2: Issue Stock
    await executeStep(1, 'Issue Goods', 'erp.inventory.stock.issued.v1');
    // Step 3: Create Invoice
    await executeStep(2, 'Generate Invoice', 'erp.sales.invoice.issued.v1');
    // Step 4: Post GL
    await executeStep(3, 'Post Journal Entry', 'erp.accounting.journal.posted.v1');

    if (statusBadge) {
      statusBadge.className = 'badge badge-success';
      statusBadge.textContent = 'SAGA COMPLETED (ACID COMPLIANT)';
    }
    logEvent('Temporal Saga Finished: All 4 Distributed Steps Committed with Zero Data Drift');
    isRunning = false;
  });

  /* 2. Stock Shortage Backorder Flow */
  if (btnShortage) {
    btnShortage.addEventListener('click', async () => {
      if (isRunning) return;
      isRunning = true;
      resetSaga();
      if (statusBadge) {
        statusBadge.className = 'badge badge-warning';
        statusBadge.textContent = 'CHECKING AVAILABILITY';
      }
      logEvent('Temporal Workflow Started: Availability Check under Concurrency');

      const step1 = timelineSteps[0];
      step1.classList.add('running');
      await sleep(800);
      step1.classList.remove('running');
      step1.classList.add('compensated');
      step1.querySelector('.badge').className = 'badge badge-warning';
      step1.querySelector('.badge').textContent = 'SHORTAGE';
      
      logEvent('Inventory Availability check: Insufficient on-hand quantity for SKU-881', true);
      logEvent('Order automatically transitioned to BACKORDER state. Zero orphan reserves created.');

      if (statusBadge) {
        statusBadge.className = 'badge badge-warning';
        statusBadge.textContent = 'GRACEFUL BACKORDER';
      }
      isRunning = false;
    });
  }

  /* 3. Failure & Business Compensation Rollback */
  btnCompensate.addEventListener('click', async () => {
    if (isRunning) return;
    isRunning = true;
    resetSaga();
    if (statusBadge) {
      statusBadge.className = 'badge badge-warning';
      statusBadge.textContent = 'EXECUTING SAGA (WITH PLANNED FAULT)';
    }
    logEvent('Temporal Workflow Started: Simulating Step 4 Ledger Period Fault');

    // Steps 1-3 succeed
    await executeStep(0, 'Reserve Stock', 'erp.inventory.stock.reserved.v1');
    await executeStep(1, 'Issue Goods', 'erp.inventory.stock.issued.v1');
    await executeStep(2, 'Generate Invoice', 'erp.sales.invoice.issued.v1');

    // Step 4 Fails (e.g., Fiscal Period Closed or Imbalance)
    const step4 = timelineSteps[3];
    step4.classList.add('running');
    await sleep(700);
    step4.classList.remove('running');
    step4.classList.add('compensated');
    step4.querySelector('.badge').className = 'badge badge-danger';
    step4.querySelector('.badge').textContent = 'PERIOD CLOSED (422)';
    logEvent('Accounting Post Rejected: Fiscal Period FY2026-08 is LOCKED (BR-03.03)', true);

    if (statusBadge) {
      statusBadge.className = 'badge badge-danger';
      statusBadge.textContent = 'TRIGGERING COMPENSATIONS IN REVERSE';
    }

    logEvent('Temporal Compensation Stack Triggered: Executing Compensating Activities');
    await sleep(600);

    // Compensate Step 3: Issue Credit Note
    await executeStep(2, 'Issue Credit Note', 'sales.issueCreditNote(reason="SAGA_COMPENSATION")', true);
    // Compensate Step 2: Reverse Stock Movement
    await executeStep(1, 'Reverse Goods Issue', 'inventory.reverseIssue(movementIds=[...])', true);
    // Compensate Step 1: Release Reservation
    await executeStep(0, 'Release Reservation', 'inventory.releaseReservation(reservationId="...")', true);

    if (statusBadge) {
      statusBadge.className = 'badge badge-success';
      statusBadge.textContent = 'CONSISTENCY RESTORED (100% REVERSED)';
    }
    logEvent('Saga Compensations Complete: Ledger, Stock, and Orders returned to flawless baseline state.');
    isRunning = false;
  });
}
