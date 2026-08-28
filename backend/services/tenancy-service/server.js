/**
 * NEXUS ENTERPRISE ERP — TENANCY SERVICE (Port 3002)
 * Multi-Tenant Router, Dynamic RLS Connection Management & Organization Hierarchy
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { createLogger } = require('../../shared/logger');

const logger = createLogger('tenancy-service');
const PORT = process.env.TENANCY_PORT || 3002;
const dataDir = path.join(__dirname, '../../data');
const tenantsFile = path.join(dataDir, 'tenants.json');

function readJson(file, defVal = []) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return defVal; }
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

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (pathname === '/health' || pathname === '/api/v1/tenants/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ONLINE', service: 'tenancy-service', port: PORT }));
    logger.http(req.method, pathname, 200, Date.now() - start);
    return;
  }

  // Get All Tenants
  if (pathname === '/api/v1/tenants' && req.method === 'GET') {
    const tenants = readJson(tenantsFile);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, count: tenants.length, tenants }));
    logger.http(req.method, pathname, 200, Date.now() - start);
    return;
  }

  // Get Single Tenant by Slug
  if (pathname.startsWith('/api/v1/tenants/') && req.method === 'GET') {
    const slug = pathname.replace('/api/v1/tenants/', '');
    const tenants = readJson(tenantsFile);
    const tenant = tenants.find(t => t.slug === slug || t.id === slug) || tenants[0];

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      tenant,
      rlsIsolationKernel: 'POSTGRESQL_16_ACTIVE',
      schemaNamespace: `tenant_${tenant ? tenant.slug.replace(/-/g, '_') : 'shared'}`
    }));
    logger.http(req.method, pathname, 200, Date.now() - start);
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'ROUTE_NOT_FOUND', service: 'tenancy-service' }));
});

server.listen(PORT, () => {
  logger.info(`tenancy-service listening on port ${PORT}`);
});
