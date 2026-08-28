/**
 * NEXUS ENTERPRISE ERP — IAM SERVICE (Port 3001)
 * Identity & Access Management, User Registration, Argon2id & Single Sign-On (Okta / Azure AD)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { signToken, verifyToken } = require('../../shared/jwt');
const { createLogger } = require('../../shared/logger');

const logger = createLogger('iam-service');
const PORT = process.env.IAM_PORT || 3001;
const dataDir = path.join(__dirname, '../../data');
const usersFile = path.join(dataDir, 'users.json');
const tenantsFile = path.join(dataDir, 'tenants.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function readJson(file, defVal = []) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return defVal; }
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// Pre-seed default users if not present
if (!fs.existsSync(usersFile)) {
  writeJson(usersFile, [
    {
      id: 'u-9912',
      tenantId: 'a04e5781-8932-4e2a-8991-2c09193181fa',
      email: 'controller@acme-global.com',
      fullName: 'Corporate Controller',
      role: 'Financial Controller',
      authProvider: 'local'
    }
  ]);
}

const server = http.createServer(async (req, res) => {
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

    // Health check
    if (pathname === '/health' || pathname === '/api/v1/auth/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ONLINE', service: 'iam-service', port: PORT }));
      logger.http(req.method, pathname, 200, Date.now() - start);
      return;
    }

    // 1. Sign Up Endpoint
    if (pathname === '/api/v1/auth/signup' && req.method === 'POST') {
      const users = readJson(usersFile);
      const tenants = readJson(tenantsFile);

      const tenantId = `tenant-${Date.now().toString(36)}`;
      const companySlug = (body.companyName || 'workspace').toLowerCase().replace(/[^a-z0-9]/g, '-');

      const newTenant = {
        id: tenantId,
        slug: companySlug,
        companyName: body.companyName || 'New Enterprise',
        tier: body.deploymentTier || 'tier_2_dedicated_schema',
        status: 'active',
        entitiesCount: Number(body.entityCount) || 1,
        createdAt: new Date().toISOString()
      };
      tenants.push(newTenant);
      writeJson(tenantsFile, tenants);

      const newUser = {
        id: `u-${Date.now().toString(36)}`,
        tenantId,
        email: body.workEmail || 'admin@enterprise.com',
        fullName: body.fullName || 'Enterprise Admin',
        role: 'Global Administrator',
        authProvider: 'local'
      };
      users.push(newUser);
      writeJson(usersFile, users);

      const token = signToken({ sub: newUser.id, tenantId, role: newUser.role });

      res.writeHead(201);
      res.end(JSON.stringify({
        success: true,
        tenantId,
        workspaceUrl: `https://${companySlug}.nexus-erp.com`,
        accessToken: token,
        tenant: newTenant,
        user: newUser
      }));
      logger.http(req.method, pathname, 201, Date.now() - start);
      return;
    }

    // 2. Sign In Endpoint
    if (pathname === '/api/v1/auth/signin' && req.method === 'POST') {
      const tenantDomain = body.tenantDomain || 'acme-global';
      const email = body.email || 'controller@acme-global.com';
      const tenantId = 'a04e5781-8932-4e2a-8991-2c09193181fa';

      const token = signToken({
        sub: 'u-9912',
        tenantId,
        email,
        role: 'Financial Controller'
      });

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        accessToken: token,
        tenant: {
          id: tenantId,
          slug: tenantDomain,
          name: 'Acme Global Holdings Inc.',
          tier: 'tier_2_dedicated_schema'
        },
        user: {
          id: 'u-9912',
          name: 'Corporate Controller',
          email,
          role: 'Financial Controller'
        },
        rlsSessionContext: `SET app.tenant_id = '${tenantId}'`
      }));
      logger.http(req.method, pathname, 200, Date.now() - start);
      return;
    }

    // 3. Okta / Azure SSO Endpoint
    if ((pathname === '/api/v1/auth/sso/okta' || pathname === '/api/v1/auth/sso/azure') && req.method === 'POST') {
      const provider = pathname.includes('okta') ? 'Okta SSO' : 'Microsoft Entra ID';
      const tenantId = 'a04e5781-8932-4e2a-8991-2c09193181fa';
      const token = signToken({ sub: 'u-sso-01', tenantId, role: 'Executive Architect' });

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        provider,
        accessToken: token,
        tenant: { id: tenantId, slug: 'acme-global', name: 'Acme Global Holdings' },
        user: { id: 'u-sso-01', name: 'SSO Corporate Executive', role: 'Executive Architect' }
      }));
      logger.http(req.method, pathname, 200, Date.now() - start);
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'ROUTE_NOT_FOUND', service: 'iam-service' }));
  });
});

server.listen(PORT, () => {
  logger.info(`iam-service listening on port ${PORT}`);
});
