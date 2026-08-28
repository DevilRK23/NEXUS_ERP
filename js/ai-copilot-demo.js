/**
 * NEXUS ENTERPRISE ERP — AI COPILOT & AUTONOMOUS AUDITOR (ADR-014)
 * Natural Language Prompt Studio with Live Streaming Typewriter Effect & Telemetry Frequency
 */

document.addEventListener('DOMContentLoaded', () => {
  initAiCopilotDemo();
});

function initAiCopilotDemo() {
  const promptInput = document.getElementById('ai-prompt-input');
  const sendBtn = document.getElementById('ai-send-btn');
  const chipButtons = document.querySelectorAll('.ai-prompt-chip');
  const responseBox = document.getElementById('ai-response-box');
  const lineageTree = document.getElementById('ai-lineage-tree');
  if (!promptInput || !sendBtn || !responseBox) return;

  const responses = {
    marketing: {
      answer: `Analysis Complete: Q3 Marketing spend reached $450,000 (+12.5% vs. budget). The variance was driven by two key factors:`,
      breakdown: `
        <ul style="margin: 8px 0 12px 20px; font-size: 0.92rem; color: var(--text-muted);">
          <li><strong>$35,000:</strong> Ad-hoc Q3 Global Enterprise SaaS Summit campaign (approved via Workflow Task #WF-904).</li>
          <li><strong>$15,000:</strong> Unplanned foreign exchange rate shift on EUR-denominated vendor bill (Agency Nova GmbH).</li>
        </ul>
      `,
      evidence: `Evidence verified across 14 journal entries in accounting.journal_entry. No policy violations detected.`,
      proposal: `Drafted monthly variance explanation report ready for Controller review.`,
      nodes: ['SAP Concur / PO Stream', 'Data Warehouse (Snowflake)', 'Q3 Finance Report', 'Variance Detected: +$50k', 'Insight Generated (Audit Clean)']
    },
    ocr: {
      answer: `OCR Bill Extraction Succeeded (Confidence: 99.4%): Scanned invoice #INV-8892 from Acme Industrial Supply parsed into structured proposal.`,
      breakdown: `
        <ul style="margin: 8px 0 12px 20px; font-size: 0.92rem; color: var(--text-muted);">
          <li><strong>PO Reference:</strong> Linked to Purchase Order #PO-2026-1102 (Matched 100%).</li>
          <li><strong>Total Amount:</strong> $14,250.00 USD (Tax: $1,282.50 @ GST 9%).</li>
          <li><strong>3-Way Match Check:</strong> GRN #GRN-994 confirms full receipt. Variance: 0.00%.</li>
        </ul>
      `,
      evidence: `Pre-flight ledger simulation passed: Valid period FY2026-08 open. Posting intent ready.`,
      proposal: `PROPOSAL GENERATED: Awaiting human confirmation to submit bill for payment release.`,
      nodes: ['Scanned PDF / S3', 'LangGraph Vision Agent', 'PO #PO-1102 Match', '3-Way Match Passed', 'Proposal Awaiting Human Signoff']
    },
    cashflow: {
      answer: `90-Day Cash Flow Forecast Simulation: Under scenario of +15 days customer collection delay:`,
      breakdown: `
        <ul style="margin: 8px 0 12px 20px; font-size: 0.92rem; color: var(--text-muted);">
          <li><strong>Estimated End-of-Month Balance:</strong> $2,840,000 USD (Comfortably above $1.5M reserve threshold).</li>
          <li><strong>High-Impact AP Outflows:</strong> Scheduled payroll on Sep 30 ($820k) and vendor bulk discount execution ($340k).</li>
          <li><strong>Recommendation:</strong> Offer 1.5% early settlement discount on top 5 overdue invoices to accelerate $420k inflow.</li>
        </ul>
      `,
      evidence: `Derived from 1,240 open AR invoices in accounting.ar_open_item with historical customer payment velocity modeling.`,
      proposal: `Generated automated dunning priority ladder proposal for AR Clerk approval.`,
      nodes: ['AR Subledger Open Items', 'Customer Payment Velocity Engine', 'Monte Carlo Simulation', 'Cash Reserve Projected', 'Dunning Recommendation']
    }
  };

  chipButtons.forEach(chip => {
    chip.addEventListener('click', () => {
      promptInput.value = chip.textContent.trim();
      const promptKey = chip.getAttribute('data-prompt-key') || 'marketing';
      runAiQuery(promptKey);
    });
  });

  sendBtn.addEventListener('click', () => {
    const val = promptInput.value.trim();
    runAiQuery(val || 'marketing');
  });

  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = promptInput.value.trim();
      runAiQuery(val || 'marketing');
    }
  });

  async function runAiQuery(queryText) {
    let resp = responses[queryText] || responses.marketing;

    try {
      const apiBase = window.API_BASE || 'http://localhost:3000';
      const response = await fetch(`${apiBase}/api/v1/ai/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptInput.value || key })
      });
      const data = await response.json();
      if (data && data.answer) {
        resp = {
          answer: data.answer,
          breakdown: data.breakdown,
          evidence: data.evidence,
          proposal: data.proposal,
          nodes: data.lineageNodes || resp.nodes
        };
      }
    } catch (err) {}

    responseBox.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; color: var(--accent-cyan); font-size: 0.9rem;">
          <div class="radar-live-beacon">
            <span class="beacon-core"></span>
            <span class="beacon-wave"></span>
          </div>
          <span>LangGraph 3.12 Engine (Port 5000) Generating Stream...</span>
        </div>
        <div class="telemetry-waveform">
          <div class="telemetry-bar"></div>
          <div class="telemetry-bar"></div>
          <div class="telemetry-bar"></div>
          <div class="telemetry-bar"></div>
          <div class="telemetry-bar"></div>
        </div>
      </div>
    `;

    await new Promise(r => setTimeout(r, 400));

    // Typewriter streaming simulation for answer
    const container = document.createElement('div');
    container.style.lineHeight = '1.6';
    responseBox.innerHTML = '';
    responseBox.appendChild(container);

    const titleEl = document.createElement('div');
    titleEl.style.fontWeight = '700';
    titleEl.style.marginBottom = '6px';
    titleEl.style.color = 'var(--text-main)';
    container.appendChild(titleEl);

    const fullText = resp.answer;
    let charIndex = 0;

    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (charIndex < fullText.length) {
          titleEl.textContent = fullText.slice(0, charIndex + 1);
          charIndex += 2;
        } else {
          titleEl.textContent = fullText;
          clearInterval(interval);
          resolve();
        }
      }, 15);
    });

    // Append breakdown and actions
    const restContent = document.createElement('div');
    restContent.innerHTML = `
      ${resp.breakdown}
      <div style="font-size: 0.85rem; color: var(--accent-emerald); background: rgba(16, 185, 129, 0.1); padding: 10px 14px; border-radius: var(--radius-sm); border-left: 3px solid var(--accent-emerald); margin-bottom: 12px;">
        ✓ ${resp.evidence}
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0, 0, 0, 0.3); padding: 14px 18px; border-radius: var(--radius-md); border: 1px solid var(--border-medium);">
        <span style="font-size: 0.88rem; font-weight: 700; color: var(--accent-amber);">${resp.proposal}</span>
        <button class="btn btn-primary btn-sm" id="ai-approve-action-btn">Approve Action</button>
      </div>
    `;
    container.appendChild(restContent);

    const approveBtn = restContent.querySelector('#ai-approve-action-btn');
    if (approveBtn) {
      approveBtn.addEventListener('click', () => {
        approveBtn.textContent = '✓ Action Dispatched to Workflow';
        approveBtn.classList.remove('btn-primary');
        approveBtn.classList.add('btn-secondary');
        approveBtn.style.color = 'var(--accent-emerald)';
      });
    }

    if (lineageTree) {
      lineageTree.innerHTML = resp.nodes.map((node, i) => `
        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-family: var(--font-mono);">
          <span class="badge ${i === resp.nodes.length - 1 ? 'badge-success' : 'badge-info'}">${node}</span>
          ${i < resp.nodes.length - 1 ? '<span style="color: var(--text-dim);">➔</span>' : ''}
        </div>
      `).join('');
    }
  }

  // Run initial query
  runAiQuery('marketing');
}
