/**
 * NEXUS ENTERPRISE ERP — INTERACTIVE ROI & TCO CALCULATOR
 * Real-Time Dynamic Savings, Financial Close Acceleration & Payback Modeler
 */

document.addEventListener('DOMContentLoaded', () => {
  initRoiCalculator();
});

function initRoiCalculator() {
  const entitiesSlider = document.getElementById('roi-entities-slider');
  const entitiesVal = document.getElementById('roi-entities-val');
  const transactionsSlider = document.getElementById('roi-transactions-slider');
  const transactionsVal = document.getElementById('roi-transactions-val');
  const headcountSlider = document.getElementById('roi-headcount-slider');
  const headcountVal = document.getElementById('roi-headcount-val');
  const legacyCostSlider = document.getElementById('roi-legacy-slider');
  const legacyCostVal = document.getElementById('roi-legacy-val');

  const annualSavingsEl = document.getElementById('roi-annual-savings');
  const closeDaysEl = document.getElementById('roi-close-days');
  const touchlessRateEl = document.getElementById('roi-touchless-rate');
  const paybackPeriodEl = document.getElementById('roi-payback-period');

  if (!entitiesSlider || !annualSavingsEl) return;

  function recalculateRoi() {
    const entities = parseInt(entitiesSlider.value, 10);
    const transactions = parseInt(transactionsSlider.value, 10);
    const headcount = parseInt(headcountSlider.value, 10);
    const legacyCost = parseInt(legacyCostSlider.value, 10);

    entitiesVal.textContent = entities;
    transactionsVal.textContent = transactions.toLocaleString();
    headcountVal.textContent = headcount.toLocaleString();
    legacyCostVal.textContent = `$${legacyCost.toLocaleString()}`;

    // Calculation Models
    // 1. Licensing & Infra savings (typically 45% reduction vs legacy monolithic ERP)
    const licensingSavings = legacyCost * 0.45;
    // 2. Operational Automation savings ($0.85 saved per transaction in automated 3-way match & posting)
    const operationalSavings = (transactions * 12) * 0.42;
    // 3. HR/Payroll automated processing ($45 saved per employee per year)
    const hrSavings = headcount * 45;
    const totalAnnualSavings = licensingSavings + operationalSavings + hrSavings;

    // 4. Financial close acceleration (days)
    const baselineCloseDays = 14;
    const acceleratedCloseDays = Math.max(2, Math.round(baselineCloseDays - (entities * 0.2 + 8)));

    // 5. Payback period in months
    const implementationCost = Math.max(35000, totalAnnualSavings * 0.25);
    const paybackMonths = Math.max(2.4, ((implementationCost / totalAnnualSavings) * 12)).toFixed(1);

    annualSavingsEl.textContent = `$${Math.round(totalAnnualSavings).toLocaleString()}`;
    closeDaysEl.textContent = `${acceleratedCloseDays} Days (from 14)`;
    touchlessRateEl.textContent = `88.5%`;
    paybackPeriodEl.textContent = `${paybackMonths} Months`;
  }

  [entitiesSlider, transactionsSlider, headcountSlider, legacyCostSlider].forEach(slider => {
    slider.addEventListener('input', recalculateRoi);
  });

  recalculateRoi();
}
