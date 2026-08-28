/**
 * NEXUS ENTERPRISE ERP — ARCHITECTURE VISUALIZER & ADR EXPLORER
 * Interactive C4 Level 2 Container Inspection & Architecture Decision Records (ADR-001..014)
 */

document.addEventListener('DOMContentLoaded', () => {
  initArchitectureVisualizer();
  initAdrExplorer();
});

const serviceSpecs = {
  'iam-service': {
    name: 'iam-service',
    title: 'Identity & Access Management Service',
    tech: 'Node.js 22 LTS / NestJS 11 / PostgreSQL / Redis',
    role: 'Root of trust for authentication, token issuance, user lifecycle, roles, permissions, sessions, MFA, and IdP federation (SAML/OIDC).',
    dataOwned: ['user', 'credential', 'session', 'mfa_factor', 'role', 'permission', 'user_company_access', 'idp_config'],
    publishes: ['iam.user.created', 'iam.role.changed', 'iam.permissions.changed', 'iam.user.login_failed'],
    consumes: ['tenancy.company.created (to seed default roles)'],
    syncDeps: 'None (deliberate root of trust). Token validation is local via JWKS cache — zero IAM network call on request path.',
    scaling: '3 Replicas baseline; JWKS cached in-memory, permission bitmap cached 60s in Redis.'
  },
  'tenancy-service': {
    name: 'tenancy-service',
    title: 'Tenancy & Isolation Tier Service',
    tech: 'Node.js 22 LTS / NestJS 11 / PostgreSQL / Redis',
    role: 'Tenant registry, isolation tier routing (Pooled vs Dedicated Schema vs Dedicated Cluster), company/branch hierarchy, fiscal calendars, and feature entitlements.',
    dataOwned: ['tenant', 'tenant_isolation', 'company', 'branch', 'fiscal_year', 'currency', 'exchange_rate', 'subscription', 'entitlement'],
    publishes: ['tenancy.tenant.provisioned', 'tenancy.company.created', 'tenancy.branch.created', 'tenancy.exchange_rate.published', 'tenancy.entitlement.changed'],
    consumes: ['Usage-relevant events from all services for plan metering'],
    syncDeps: 'Zero runtime dependency. Company, branch, and currency reference data is replicated as local projections into all downstream services.',
    scaling: 'Very high read, low write. Aggressive Redis caching with event-driven invalidation.'
  },
  'accounting-service': {
    name: 'accounting-service',
    title: 'Accounting & General Ledger Core',
    tech: 'Node.js 22 LTS / NestJS 11 / PostgreSQL 16 (Append-Only) / Redis',
    role: 'Sole owner of the General Ledger (ADR-009). Double-entry bookkeeping, AR/AP subledgers, multi-currency realized/unrealized FX revaluation, tax transactions, and financial statements.',
    dataOwned: ['account (LTREE hierarchy)', 'fiscal_year', 'fiscal_period', 'journal_entry (append-only)', 'journal_line', 'account_balance', 'ar_open_item', 'ap_open_item', 'tax_transaction'],
    publishes: ['accounting.journal.posted', 'accounting.journal.reversed', 'accounting.posting.failed', 'accounting.period.closed', 'accounting.invoice.settled'],
    consumes: ['sales.invoice.issued', 'purchase.bill.approved', 'inventory.movement.valued', 'payroll.run.locked', 'all posting intents'],
    syncDeps: 'Platform numbering service (for gapless journal numbers allocated at posting time).',
    scaling: 'Highest data integrity requirement. CQRS architecture: write-heavy posting engine + read replica for financial reporting.'
  },
  'inventory-service': {
    name: 'inventory-service',
    title: 'Inventory & Valuation Engine',
    tech: 'Node.js 22 LTS / NestJS 11 / PostgreSQL / Redis',
    role: 'Warehouses, bin locations, signed stock movements, FIFO valuation layers, stock reservations, batch/serial tracking, and real-time availability checks.',
    dataOwned: ['warehouse', 'bin', 'batch', 'stock_movement (append-only)', 'stock_balance', 'valuation_layer (FIFO)', 'reservation', 'stock_count'],
    publishes: ['inventory.stock.received', 'inventory.stock.issued', 'inventory.stock.reserved', 'inventory.movement.valued', 'inventory.count.approved'],
    consumes: ['mdm.item.*', 'purchase.receipt.confirmed', 'sales.delivery.confirmed'],
    syncDeps: 'Exposes GET /availability for sub-300ms cached check by Sales at order confirmation.',
    scaling: 'Highest write concurrency of any business service. Row-level locking on stock_balance primary key.'
  },
  'workflow-service': {
    name: 'workflow-service',
    title: 'Temporal Durable Workflow & Saga Service',
    tech: 'TypeScript / Temporal Engine 1.24+ / PostgreSQL',
    role: 'Orchestrates distributed long-running business sagas (Order-to-Cash, Procure-to-Pay, Month-End Close) with automatic compensations on failure (ADR-007, ADR-008).',
    dataOwned: ['process_definition', 'approval_matrix', 'task_inbox', 'delegation_rule'],
    publishes: ['workflow.task.created', 'workflow.task.completed', 'workflow.approval.completed', 'workflow.escalated'],
    consumes: ['*.submitted_for_approval from all business services'],
    syncDeps: 'Temporal durable state machine with automatic activity retry and compensation rollback.',
    scaling: 'Horizontally parallel workers fanning out activities across Kubernetes pods.'
  },
  'ai-service': {
    name: 'ai-service',
    title: 'Enterprise AI Tier & Safe Copilot',
    tech: 'Python 3.12 / FastAPI / LangGraph / pgvector / Bedrock & OpenAI',
    role: 'Permission-scoped autonomous financial auditing, smart variance explanation, OCR invoice extraction, and predictive cash flow forecasting (ADR-014).',
    dataOwned: ['pgvector tenant-scoped embeddings', 'agent_trace_log'],
    publishes: ['ai.proposal.created', 'ai.anomaly.flagged'],
    consumes: ['Kafka domain events building vector feature stores'],
    syncDeps: 'Executes under the requesting user’s OAuth token exchange. Zero direct autonomous posting: drafts proposals for human approval.',
    scaling: 'Stateless FastAPI workers with asynchronous GPU-backed embedding and LLM inferencing.'
  }
};

const adrRecords = [
  {
    id: 'ADR-001',
    title: 'Right-Sized Service Decomposition along Bounded Contexts',
    status: 'Accepted',
    context: 'How to decompose the ERP without falling into a distributed monolith or an unmaintainable single database monolith.',
    decision: 'Decompose into 16 bounded context services (Finance, Inventory, Sales, Purchase, CRM, HR, Payroll, etc.). No cross-database queries or foreign keys. Shared data replicated via asynchronous event projections.',
    consequences: 'Zero runtime blocking dependencies for standard queries. High resilience and independent service scalability.'
  },
  {
    id: 'ADR-002',
    title: 'Pooled Shared-Schema Tenancy with PostgreSQL RLS',
    status: 'Accepted',
    context: 'Balance operational cost efficiency with rock-solid data isolation for multi-tenant enterprise customers.',
    decision: 'PostgreSQL Row-Level Security (RLS) forced on all tenant tables with transaction-local `set_config(\'app.tenant_id\', ..., true)`. Seamless promotion to dedicated schemas or clusters with zero code change.',
    consequences: 'Eliminates cross-tenant data leakage at the database engine level. Connection pool reuse remains 100% safe.'
  },
  {
    id: 'ADR-005',
    title: 'Kafka as the Single Event Backbone with Schema Registry',
    status: 'Accepted',
    context: 'Asynchronous event streaming and cross-service projection synchronization.',
    decision: 'Apache Kafka (AWS MSK) with JSON Schema Registry. Backward-compatibility enforced in CI. Aggregate ID as partition key for guaranteed sequential per-entity ordering.',
    consequences: 'Provides 30-day durable replay capability for instant search index rebuilds and analytics hydration.'
  },
  {
    id: 'ADR-006',
    title: 'Transactional Outbox & Idempotent Consumer Tables',
    status: 'Accepted',
    context: 'Preventing dual-write distributed data corruption between database transactions and message brokers.',
    decision: 'Write domain events to a local `outbox_event` table in the same DB transaction. A polling relay publishes to Kafka. Consumers write to `processed_event` inside the consuming transaction.',
    consequences: 'Guarantees at-least-once delivery with strictly idempotent execution across all 16 microservices.'
  },
  {
    id: 'ADR-007',
    title: 'Sync for Queries Only; Orchestrated Sagas for Transactions',
    status: 'Accepted',
    context: 'Managing cross-service distributed workflows (e.g. Order-to-Cash across Sales, Inventory, and Accounting).',
    decision: 'Synchronous REST only for read queries. Cross-boundary business mutations execute as Temporal-orchestrated Sagas with explicit business compensating transactions on failure.',
    consequences: 'No distributed two-phase commit (2PC) deadlocks; system guarantees eventual consistency and automated rollback.'
  },
  {
    id: 'ADR-009',
    title: 'Accounting Owns the GL; Versioned Idempotent Posting Contract',
    status: 'Accepted',
    context: 'Enforcing financial integrity across multiple sales, purchase, and payroll posting sources.',
    decision: '`accounting-service` is the sole writer of the ledger. Append-only schema with database trigger blocking mutations/deletes. Idempotency key prevents duplicate postings.',
    consequences: 'Absolute financial audit defense. Failed postings land in an exception queue without blocking the originating business module.'
  },
  {
    id: 'ADR-014',
    title: 'AI Tier as an Isolated Tier with Permission-Scoped Access',
    status: 'Accepted',
    context: 'Integrating AI LLM capabilities without risk of prompt injection privilege escalation or rogue financial entries.',
    decision: 'Python/LangGraph AI service operates under the user’s OAuth token exchange. Pre-filtered pgvector queries. AI outputs proposals for human confirmation; zero autonomous ledger posting.',
    consequences: 'Guarantees compliance and auditability. AI actions are audited with `actor_type = \'AGENT\'`.'
  }
];

function initArchitectureVisualizer() {
  const serviceNodes = document.querySelectorAll('.c4-service-node');
  const drawer = document.getElementById('service-inspector-drawer');
  if (!serviceNodes.length || !drawer) return;

  serviceNodes.forEach(node => {
    node.addEventListener('click', () => {
      serviceNodes.forEach(n => n.classList.remove('active'));
      node.classList.add('active');
      const serviceId = node.getAttribute('data-service') || 'accounting-service';
      renderServiceDetails(serviceSpecs[serviceId] || serviceSpecs['accounting-service']);
    });
  });

  function renderServiceDetails(spec) {
    drawer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border-subtle); padding-bottom: 16px;">
        <div>
          <div class="c4-node-title" style="font-size: 1.25rem; color: var(--accent-cyan);">${spec.title}</div>
          <div style="font-size: 0.85rem; font-family: var(--font-mono); color: var(--text-muted);">${spec.name} • ${spec.tech}</div>
        </div>
        <span class="badge badge-success">CLEAN ARCHITECTURE</span>
      </div>
      <p style="font-size: 0.95rem; color: var(--text-main); line-height: 1.6;">${spec.role}</p>
      
      <div class="inspector-grid">
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase;">Data Owned (Schema Isolation)</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${spec.dataOwned.map(table => `<span class="badge badge-info font-mono">${table}</span>`).join('')}
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase;">Scaling & Dependencies</div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">${spec.scaling}</div>
          <div style="font-size: 0.8rem; color: var(--accent-amber); margin-top: 4px;">Sync Policy: ${spec.syncDeps}</div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase;">Published Domain Events (Kafka MSK)</div>
        <div class="event-stream-box" style="max-height: 100px;">
          ${spec.publishes.map(ev => `<div class="event-stream-row"><span>${ev}</span><span class="badge badge-purple" style="font-size: 0.65rem;">OUTBOX</span></div>`).join('')}
        </div>
      </div>
    `;
  }

  // Render initial detail
  renderServiceDetails(serviceSpecs['accounting-service']);
}

function initAdrExplorer() {
  const adrContainer = document.getElementById('adr-grid-list');
  if (!adrContainer) return;

  adrContainer.innerHTML = adrRecords.map(adr => `
    <div class="adr-card" onclick="openAdrModal('${adr.id}')">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="adr-id">${adr.id}</span>
        <span class="badge badge-success">${adr.status}</span>
      </div>
      <div class="adr-title">${adr.title}</div>
      <div class="adr-rationale">${adr.decision}</div>
    </div>
  `).join('');
}

window.openAdrModal = function(adrId) {
  const adr = adrRecords.find(a => a.id === adrId) || adrRecords[0];
  const modal = document.getElementById('generic-modal');
  const title = document.getElementById('generic-modal-title');
  const body = document.getElementById('generic-modal-body');
  if (!modal || !title || !body) return;

  title.innerHTML = `<span style="color: var(--accent-cyan); font-family: var(--font-mono);">${adr.id}:</span> ${adr.title}`;
  body.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div>
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 6px;">Context & Problem Statement</div>
        <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6;">${adr.context}</p>
      </div>
      <div>
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-cyan); text-transform: uppercase; margin-bottom: 6px;">Architectural Decision</div>
        <p style="color: var(--text-main); font-size: 0.95rem; line-height: 1.6; background: rgba(0,0,0,0.25); padding: 14px; border-radius: var(--radius-sm); border-left: 3px solid var(--accent-cyan);">${adr.decision}</p>
      </div>
      <div>
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-emerald); text-transform: uppercase; margin-bottom: 6px;">Consequences & System Benefits</div>
        <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6;">${adr.consequences}</p>
      </div>
    </div>
  `;
  modal.classList.add('open');
};
