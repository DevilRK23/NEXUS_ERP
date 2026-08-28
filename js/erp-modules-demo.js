/**
 * NEXUS ENTERPRISE ERP — INTERACTIVE MODULES SANDBOXES
 * Live Interactive Demos for General Ledger, Inventory, 3-Way Match, CRM, Payroll & RLS
 */

document.addEventListener('DOMContentLoaded', () => {
  initModuleTabs();
  initGeneralLedgerDemo();
  initInventoryMatrixDemo();
  initThreeWayMatchDemo();
  initCrmKanbanDemo();
  initPayrollTraceDemo();
  initRlsSimulatorDemo();
});

/* Module Tab Navigation */
function initModuleTabs() {
  const tabButtons = document.querySelectorAll('.module-nav-item');
  const panels = document.querySelectorAll('.module-panel');
  if (!tabButtons.length) return;

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetModule = btn.getAttribute('data-module');
      const targetPanel = document.getElementById(`module-${targetModule}`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });
}

/* 1. FM-03 General Ledger (Accounting) Interactive Editor */
function initGeneralLedgerDemo() {
  const debitInputs = document.querySelectorAll('.gl-debit-input');
  const creditInputs = document.querySelectorAll('.gl-credit-input');
  const totalDebitEl = document.getElementById('gl-total-debit');
  const totalCreditEl = document.getElementById('gl-total-credit');
  const statusEl = document.getElementById('gl-balance-status');
  const postBtn = document.getElementById('gl-post-btn');
  const ledgerHistoryTable = document.getElementById('gl-ledger-table-body');
  if (!totalDebitEl || !totalCreditEl || !statusEl || !postBtn) return;

  let currentEntrySeq = 142;

  function recalculateGL() {
    let sumDebit = 0;
    let sumCredit = 0;

    document.querySelectorAll('.gl-debit-input').forEach(input => {
      sumDebit += parseFloat(input.value) || 0;
    });
    document.querySelectorAll('.gl-credit-input').forEach(input => {
      sumCredit += parseFloat(input.value) || 0;
    });

    totalDebitEl.textContent = `$${sumDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    totalCreditEl.textContent = `$${sumCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const diff = Math.abs(sumDebit - sumCredit);
    if (diff < 0.001 && (sumDebit > 0 || sumCredit > 0)) {
      statusEl.className = 'balance-status balanced';
      statusEl.innerHTML = `<span class="badge badge-success">✓ BALANCED (Diff: $0.00)</span>`;
      postBtn.disabled = false;
      postBtn.style.opacity = '1';
    } else {
      statusEl.className = 'balance-status unbalanced';
      statusEl.innerHTML = `<span class="badge badge-danger">✗ IMBALANCE: $${diff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (BR-03.01)</span>`;
      postBtn.disabled = true;
      postBtn.style.opacity = '0.5';
    }
  }

  document.querySelectorAll('.gl-debit-input, .gl-credit-input').forEach(input => {
    input.addEventListener('input', recalculateGL);
  });

  postBtn.addEventListener('click', async () => {
    postBtn.disabled = true;
    postBtn.textContent = 'Posting to Ledger...';

    const lines = [];
    document.querySelectorAll('.gl-input-row').forEach(row => {
      const acc = row.querySelector('input[readonly]')?.value || '1110';
      const deb = parseFloat(row.querySelector('.gl-debit-input')?.value) || 0;
      const cred = parseFloat(row.querySelector('.gl-credit-input')?.value) || 0;
      lines.push({ accountId: acc.slice(0, 4), accountName: acc, debit: deb, credit: cred });
    });

    try {
      const apiBase = window.API_BASE || 'http://localhost:3000';
      const response = await fetch(`${apiBase}/api/v1/accounting/journals/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'Enterprise Revenue & Treasury Settlement',
          lines
        })
      });
      const data = await response.json();

      if (data.success) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="font-mono" style="color: var(--accent-cyan); font-weight: 700;">${data.entryNumber}</td>
          <td>${data.entry.postingDate}</td>
          <td>${data.entry.description}</td>
          <td class="font-mono">${totalDebitEl.textContent}</td>
          <td class="font-mono">${totalCreditEl.textContent}</td>
          <td><span class="badge badge-success">POSTED (IMMUTABLE)</span></td>
        `;
        ledgerHistoryTable.prepend(row);
        showToast(`✓ Server Verified: Journal ${data.entryNumber} persisted with gapless immutability!`, 'success');
      } else {
        showToast(`✗ Failed to post: ${data.message}`, 'danger');
      }
    } catch (err) {
      currentEntrySeq++;
      const gaplessNo = `JE-2026-${String(currentEntrySeq).padStart(6, '0')}`;
      const dateStr = new Date().toISOString().split('T')[0];

      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="font-mono" style="color: var(--accent-cyan); font-weight: 700;">${gaplessNo}</td>
        <td>${dateStr}</td>
        <td>General Adjustments (Interactive)</td>
        <td class="font-mono">${totalDebitEl.textContent}</td>
        <td class="font-mono">${totalCreditEl.textContent}</td>
        <td><span class="badge badge-success">POSTED (IMMUTABLE)</span></td>
      `;
      ledgerHistoryTable.prepend(row);
      showToast(`Journal ${gaplessNo} successfully posted to append-only ledger!`, 'success');
    } finally {
      postBtn.disabled = false;
      postBtn.textContent = 'Post to Immutable Ledger';
    }
  });

  recalculateGL();
}

/* 2. FM-04 Inventory Matrix & Availability Calculator */
function initInventoryMatrixDemo() {
  const onHandInput = document.getElementById('inv-onhand-input');
  const reservedInput = document.getElementById('inv-reserved-input');
  const incomingInput = document.getElementById('inv-incoming-input');
  const availableResult = document.getElementById('inv-available-result');
  if (!onHandInput || !reservedInput || !availableResult) return;

  function recalculateStock() {
    const onHand = parseFloat(onHandInput.value) || 0;
    const reserved = parseFloat(reservedInput.value) || 0;
    const incoming = parseFloat(incomingInput?.value) || 0;

    const available = onHand - reserved;
    availableResult.textContent = `${available.toLocaleString()} Units`;

    if (available < 100) {
      availableResult.style.color = 'var(--accent-rose)';
    } else {
      availableResult.style.color = 'var(--accent-cyan)';
    }
  }

  [onHandInput, reservedInput, incomingInput].forEach(inp => {
    if (inp) inp.addEventListener('input', recalculateStock);
  });
  recalculateStock();
}

/* 3. FM-05 Purchasing & 3-Way Match Validator */
function initThreeWayMatchDemo() {
  const billPriceInput = document.getElementById('match-bill-price');
  const billQtyInput = document.getElementById('match-bill-qty');
  const toleranceSlider = document.getElementById('match-tolerance-slider');
  const toleranceVal = document.getElementById('match-tolerance-val');
  const matchOutcome = document.getElementById('match-outcome-box');
  if (!billPriceInput || !billQtyInput || !matchOutcome) return;

  const poPrice = 120.00;
  const poQty = 100;

  function evaluateMatch() {
    const billPrice = parseFloat(billPriceInput.value) || 0;
    const billQty = parseFloat(billQtyInput.value) || 0;
    const tolerancePercent = parseFloat(toleranceSlider?.value) || 2.0;

    if (toleranceVal) toleranceVal.textContent = `${tolerancePercent}%`;

    const priceDiffPercent = Math.abs((billPrice - poPrice) / poPrice) * 100;
    const qtyDiff = billQty - poQty;

    if (qtyDiff > 0) {
      matchOutcome.className = 'match-status-result badge-danger';
      matchOutcome.innerHTML = `⚠️ MATCH HELD: QTY_OVER_RECEIPT (Billed ${billQty} > Received ${poQty})`;
    } else if (priceDiffPercent > tolerancePercent) {
      matchOutcome.className = 'match-status-result badge-warning';
      matchOutcome.innerHTML = `⚠️ MATCH HELD: PRICE_VARIANCE (${priceDiffPercent.toFixed(1)}% exceeds ${tolerancePercent}% tolerance)`;
    } else {
      matchOutcome.className = 'match-status-result badge-success';
      matchOutcome.innerHTML = `✓ AUTO-MATCHED & APPROVED FOR PAYMENT (Posting Dr GRNI / Cr AP)`;
    }
  }

  [billPriceInput, billQtyInput, toleranceSlider].forEach(el => {
    if (el) el.addEventListener('input', evaluateMatch);
  });
  evaluateMatch();
}

/* 4. FM-06 & FM-07 CRM Pipeline Kanban */
function initCrmKanbanDemo() {
  const cards = document.querySelectorAll('.kanban-card');
  const cols = document.querySelectorAll('.kanban-col');
  if (!cards.length) return;

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', card.id);
      card.style.opacity = '0.4';
    });
    card.addEventListener('dragend', () => {
      card.style.opacity = '1';
      updatePipelineMetrics();
    });
  });

  cols.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.style.background = 'rgba(6, 182, 212, 0.08)';
    });
    col.addEventListener('dragleave', () => {
      col.style.background = 'rgba(0, 0, 0, 0.2)';
    });
    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.style.background = 'rgba(0, 0, 0, 0.2)';
      const cardId = e.dataTransfer.getData('text/plain');
      const card = document.getElementById(cardId);
      if (card) {
        col.appendChild(card);
        showToast(`Opportunity stage updated! OpportunityWon event stream armed.`, 'info');
      }
    });
  });

  function updatePipelineMetrics() {
    let totalWon = 0;
    document.querySelectorAll('#kanban-col-won .kanban-card').forEach(c => {
      const val = parseFloat(c.getAttribute('data-value')) || 0;
      totalWon += val;
    });
    const wonEl = document.getElementById('pipeline-won-total');
    if (wonEl) wonEl.textContent = `$${totalWon.toLocaleString()}`;
  }
}

/* 5. FM-09 Payroll Sandboxed Calculation Trace */
function initPayrollTraceDemo() {
  const basicInput = document.getElementById('payroll-basic-input');
  const hraInput = document.getElementById('payroll-hra-input');
  const daysWorkedInput = document.getElementById('payroll-days-input');
  const grossEl = document.getElementById('payroll-gross-total');
  const netEl = document.getElementById('payroll-net-total');
  const traceList = document.getElementById('payroll-trace-steps');
  if (!basicInput || !grossEl || !traceList) return;

  function calculatePayroll() {
    const basic = parseFloat(basicInput.value) || 0;
    const hra = parseFloat(hraInput.value) || 0;
    const days = parseFloat(daysWorkedInput.value) || 30;

    const prorationFactor = days / 30;
    const proratedBasic = basic * prorationFactor;
    const proratedHra = hra * prorationFactor;
    const grossEarnings = proratedBasic + proratedHra;

    // Statutory rules (e.g. 12% PF on basic, standard health withholding)
    const pfDeduction = proratedBasic * 0.12;
    const taxWithholding = grossEarnings * 0.08;
    const totalDeductions = pfDeduction + taxWithholding;
    const netPay = grossEarnings - totalDeductions;

    grossEl.textContent = `$${grossEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    netEl.textContent = `$${netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    traceList.innerHTML = `
      <div class="trace-step-item">
        <span class="trace-step-num">01. PRORATION</span>
        <div class="trace-step-desc">
          Prorated ${days}/30 calendar days -> Factor: ${prorationFactor.toFixed(4)}
          <div class="trace-formula">Prorated Basic = $${basic} × ${prorationFactor.toFixed(2)} = $${proratedBasic.toFixed(2)}</div>
        </div>
      </div>
      <div class="trace-step-item">
        <span class="trace-step-num">02. EARNINGS</span>
        <div class="trace-step-desc">
          Gross Earnings computation
          <div class="trace-formula">Gross = Prorated Basic ($${proratedBasic.toFixed(2)}) + Prorated HRA ($${proratedHra.toFixed(2)}) = $${grossEarnings.toFixed(2)}</div>
        </div>
      </div>
      <div class="trace-step-item">
        <span class="trace-step-num">03. STATUTORY DEDUCTION</span>
        <div class="trace-step-desc">
          Statutory PF Rule Pack v2.4 (12% of Basic) + Tax Bracket (8%)
          <div class="trace-formula">Deductions = PF ($${pfDeduction.toFixed(2)}) + Tax ($${taxWithholding.toFixed(2)}) = $${totalDeductions.toFixed(2)}</div>
        </div>
      </div>
      <div class="trace-step-item">
        <span class="trace-step-num">04. FINAL NET PAY</span>
        <div class="trace-step-desc">
          Net Disbursable Pay into Employee Bank Account
          <div class="trace-formula">Net Pay = $${grossEarnings.toFixed(2)} - $${totalDeductions.toFixed(2)} = $${netPay.toFixed(2)}</div>
        </div>
      </div>
    `;
  }

  [basicInput, hraInput, daysWorkedInput].forEach(inp => {
    inp.addEventListener('input', calculatePayroll);
  });
  calculatePayroll();
}

/* 6. FM-01 PostgreSQL Row-Level Security (RLS) Simulator */
function initRlsSimulatorDemo() {
  const tenantSelect = document.getElementById('rls-tenant-select');
  const sqlOutput = document.getElementById('rls-sql-output');
  const rowCountOutput = document.getElementById('rls-rows-output');
  if (!tenantSelect || !sqlOutput) return;

  const tenantData = {
    'tenant-alpha': {
      id: 'a04e5781-6b89-4e6f-9988-112233445566',
      name: 'Acme Global Holdings',
      rows: [
        { id: '101', entity: 'INV-2026-001', amount: '$45,000', company: 'US Operations' },
        { id: '102', entity: 'INV-2026-002', amount: '$120,000', company: 'UK Holdings' }
      ]
    },
    'tenant-beta': {
      id: 'f99c2234-1188-4422-9900-aabbccddeeff',
      name: 'OmniCorp Logistics',
      rows: [
        { id: '201', entity: 'INV-2026-901', amount: '$8,400', company: 'Omni Freight GmbH' }
      ]
    }
  };

  tenantSelect.addEventListener('change', () => {
    const selectedKey = tenantSelect.value;
    const tenant = tenantData[selectedKey] || tenantData['tenant-alpha'];

    sqlOutput.innerHTML = `
<span class="code-comment">-- Step 1: Transaction-local session context injection (zero connection pool leakage)</span>
<span class="code-keyword">SELECT</span> <span class="code-function">set_config</span>(<span class="code-string">'app.tenant_id'</span>, <span class="code-string">'${tenant.id}'</span>, <span class="code-keyword">true</span>);

<span class="code-comment">-- Step 2: Query executed with kernel-enforced Row Level Security</span>
<span class="code-keyword">SELECT</span> * <span class="code-keyword">FROM</span> sales.invoice;
<span class="code-comment">-- Engine evaluates: USING (tenant_id = current_setting('app.tenant_id')::uuid)</span>
    `;

    rowCountOutput.innerHTML = tenant.rows.map(r => `
      <tr>
        <td class="font-mono" style="color: var(--accent-cyan);">${r.id}</td>
        <td>${tenant.name}</td>
        <td class="font-mono">${r.entity}</td>
        <td>${r.company}</td>
        <td class="font-mono">${r.amount}</td>
        <td><span class="badge badge-success">ISOLATED</span></td>
      </tr>
    `).join('');

    showToast(`Context switched to ${tenant.name}. RLS strictly isolated 0 cross-tenant rows!`, 'info');
  });
}

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="badge badge-${type}">${type.toUpperCase()}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
