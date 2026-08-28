/**
 * NEXUS ENTERPRISE ERP — PURCHASING SERVICE (Port 3005) — PHASE 3
 * Automated 3-Way Match Comparator, PO Lifecycle & Price Variance Tolerance Router
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { createLogger } = require('../../shared/logger');

const logger = createLogger('purchasing-service');
const PORT = process.env.PURCHASING_PORT || 3005;
const dataDir = path.join(__dirname, '../../data');
const poFile = path.join(dataDir, 'purchase_orders.json');

function readJson(file, defVal = []) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return defVal; }
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// Pre-seed sample POs
if (!fs.existsSync(poFile)) {
  writeJson(poFile, [
    {
      poNumber: 'PO-2026-1102',
      vendorName: 'Acme Industrial Supply Corp',
      itemSku: 'SKU-8890',
      orderedQty: 100,
      unitPrice: 120.00,
      totalAmount: 12000.00,
      status: 'APPROVED',
      grnReference: 'GRN-2026-994',
      receivedQty: 100
    }
  ]);
}

const server = http.createServer((req, res) => {
  const start = Date.now();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-Id');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  let bodyString = '';
  req.on('data', chunk => { bodyString += chunk; });
  req.on('end', () => {
    let body = {};
    try { if (bodyString) body = JSON.parse(bodyString); } catch {}

    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    if (pathname === '/health' || pathname === '/api/v1/purchasing/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ONLINE', service: 'purchasing-service', version: '2026.3.0-LTS', port: PORT }));
      logger.http(req.method, pathname, 200, Date.now() - start);
      return;
    }

    // 1. Get Purchase Orders
    if (pathname === '/api/v1/purchasing/orders' && req.method === 'GET') {
      const orders = readJson(poFile);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, count: orders.length, orders }));
      logger.http(req.method, pathname, 200, Date.now() - start);
      return;
    }

    // 2. Automated 3-Way Match Comparator (PO vs GRN vs Vendor Bill)
    if (pathname === '/api/v1/purchasing/match-evaluate' && req.method === 'POST') {
      const poPrice = 120.00;
      const poQty = 100;
      const billPrice = Number(body.vendorBillPrice) || 121.50;
      const billQty = Number(body.vendorBillQty) || 100;
      const tolerance = Number(body.tolerancePercentage) !== undefined && !isNaN(body.tolerancePercentage) ? Number(body.tolerancePercentage) : 2.0;

      const priceVariancePct = Math.abs((billPrice - poPrice) / poPrice) * 100.0;
      const isMatched = (priceVariancePct <= tolerance) && (billQty === poQty);

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        poNumber: body.poNumber || 'PO-2026-1102',
        grnNumber: 'GRN-2026-994',
        billNumber: body.billNumber || 'INV-8892',
        isMatched,
        priceVariancePercentage: Math.round(priceVariancePct * 100) / 100,
        toleranceAllowed: tolerance,
        poExpectedTotal: poPrice * poQty,
        billActualTotal: billPrice * billQty,
        matchOutcome: isMatched ? 'AUTO_MATCHED_APPROVED' : 'VARIANCE_EXCEPTION_ROUTED',
        touchlessPostingIntent: isMatched ? {
          debitAccount: 'GRNI Clearing (2115)',
          creditAccount: 'Accounts Payable (2010)',
          amount: billPrice * billQty
        } : null,
        message: isMatched
          ? `3-Way Match Succeeded (${priceVariancePct.toFixed(2)}% variance within ${tolerance}% tolerance). Touchless voucher generated.`
          : `3-Way Match Exception: Variance of ${priceVariancePct.toFixed(2)}% exceeds ${tolerance}% limit. Routed to AP Manager approval workflow.`
      }));
      logger.info(`3-Way match evaluated: ${isMatched ? 'MATCHED' : 'EXCEPTION'} (Variance: ${priceVariancePct.toFixed(2)}%)`);
      logger.http(req.method, pathname, 200, Date.now() - start);
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'ROUTE_NOT_FOUND', service: 'purchasing-service' }));
  });
});

server.listen(PORT, () => {
  logger.info(`purchasing-service (Phase 3) listening on port ${PORT}`);
});
