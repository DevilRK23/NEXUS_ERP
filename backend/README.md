# ⚙️ NEXUS Enterprise ERP — Backend Microservices & API Gateway Handover Guide

Welcome to the **NEXUS Enterprise ERP Backend Package**. This package contains the unified API Gateway, 7 domain microservices, PostgreSQL 16 schema migrations, in-memory caching stores, Kafka transactional outbox engine, Temporal saga orchestration, and the LangGraph AI reasoning studio.

---

## 🚀 Quick Start (1-Click Run)

### Option 1: Double-Click (Windows)
* Double-click **`start_backend.bat`**. It will launch the Unified API Gateway on port `3000`.

### Option 2: PowerShell
```powershell
powershell -ExecutionPolicy Bypass -File .\start_backend.ps1 -Port 3000
```

### Option 3: Run Automated Verification Test Suite (20/20 Checks)
```powershell
powershell -ExecutionPolicy Bypass -File .\tests\run_full_audit.ps1
```

* **Gateway Ingress**: `http://localhost:3000/`
* **Cluster Region**: `AP-SOUTH-1-PRIMARY`

---

## 🗺️ Microservices & Port Architecture

```
                               ┌────────────────────────────────┐
                               │  UNIFIED API GATEWAY (Port 3000)│
                               └────────────────┬───────────────┘
                                                │
       ┌─────────────────┬──────────────────────┼──────────────────────┬─────────────────┐
       ▼                 ▼                      ▼                      ▼                 ▼
 ┌───────────┐     ┌───────────┐          ┌───────────┐          ┌───────────┐     ┌───────────┐
 │IAM Service│     │ Tenancy   │          │Accounting │          │ Inventory │     │ AI Studio │
 │(Port 3001)│     │(Port 3002)│          │(Port 3003)│          │(Port 3004)│     │(Port 8000)│
 └─────┬─────┘     └─────┬─────┘          └─────┬─────┘          └─────┬─────┘     └─────┬─────┘
       │                 │                      │                      │                 │
       └─────────────────┴──────────────────────┼──────────────────────┴─────────────────┘
                                                ▼
                               ┌────────────────────────────────┐
                               │   PostgreSQL 16 Multi-Tenant   │
                               │   Row-Level Security (RLS) DB  │
                               └────────────────────────────────┘
```

| Service | Port | Base Path | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `3000` | `/` | Central Ingress Proxy, Health Telemetry, CORS & Routing |
| **IAM Service** | `3001` | `/api/v1/auth/*` | Multi-Tenant Signup, SSO Authentication & RS256 JWTs |
| **Tenancy Service** | `3002` | `/api/v1/tenants/*` | Tier 1 Pooled / Tier 2 Dedicated Schema / Tier 3 VPC Routing |
| **Accounting Service** | `3003` | `/api/v1/accounting/*` | Append-only Immutable General Ledger & Real-Time Trial Balance |
| **Inventory Service** | `3004` | `/api/v1/inventory/*` | Sub-300ms SLA Availability Check & FIFO Valuation Queue |
| **Purchasing Service** | `3005` | `/api/v1/purchasing/*` | Automated 3-Way Match AP Comparator (PO vs GRN vs Bill) |
| **Payroll Service** | `3009` | `/api/v1/payroll/*` | Explainable Compensation Audit Trace & Statutory Tax Matrix |
| **Workflow Service** | `7233` | `/api/v1/workflows/*` | Temporal 4-Step Order-to-Cash Saga & Reverse Compensation Rollbacks |
| **AI Copilot Service** | `8000` | `/api/v1/ai/*` | LangGraph 3.12 Financial Q&A with 5-stage Data Lineage Graph |

---

## 📡 Complete REST API Endpoint Dictionary

### 1. Health & Cluster Status
* `GET http://localhost:3000/api/v1/health`
* **Response**: Gateway status, PostgreSQL 16 RLS status, cluster status, and health array for all 7 microservices.

### 2. Multi-Tenant IAM & Authentication
* `POST http://localhost:3000/api/v1/auth/signup`
  * **Body**: `{ "companyName": "Apex Global", "workEmail": "admin@apex.io", "deploymentTier": "tier_3_dedicated_vpc", "entityCount": 4 }`
  * **Returns**: Provisioned workspace URL, tenant ID, and RLS session context.
* `POST http://localhost:3000/api/v1/auth/signin`
  * **Body**: `{ "email": "controller@acme-global.com", "tenantDomain": "acme-global" }`
  * **Returns**: RS256 JWT accessToken and `SET app.tenant_id = '...'` session command.

### 3. Core Financial Ledger & Trial Balance
* `POST http://localhost:3000/api/v1/accounting/journals/post`
  * **Body**: `{ "description": "Settlement Inv #902", "lines": [{ "accountId": "1110", "debit": 12450, "credit": 0 }, { "accountId": "1200", "debit": 0, "credit": 12450 }] }`
  * **Rules**: Enforces Business Rule `BR-03.01` (Debit == Credit required), assigns gapless entry numbers (`JE-2026-000143`), and publishes atomic Kafka Outbox event.
* `GET http://localhost:3000/api/v1/accounting/trial-balance`
  * **Returns**: Aggregated debit vs credit sum across all accounts, period ID, and boolean `isBalanced`.
* `POST http://localhost:3000/api/v1/accounting/fx-revalue`
  * **Body**: `{ "baseCurrency": "USD", "foreignCurrency": "EUR", "foreignBalance": 500000, "originalExchangeRate": 1.08, "currentExchangeRate": 1.05 }`
  * **Returns**: Unrealized FX gain/loss and suggested GL journal posting.
* `GET http://localhost:3000/api/v1/accounting/outbox/stream`
  * **Returns**: Immutable append-only Kafka event stream.

### 4. Supply Chain & Inventory
* `POST http://localhost:3000/api/v1/inventory/availability/check`
  * **Formula**: `NetAvailable = OnHand - Reserved + Incoming` (Sub-300ms SLA).
* `POST http://localhost:3000/api/v1/inventory/reserve`
  * **Returns**: Reservation ID with PostgreSQL `SELECT FOR UPDATE` row lock active.
* `GET http://localhost:3000/api/v1/inventory/valuation-layers`
  * **Returns**: FIFO valuation queue and weighted average unit cost ($12.98).

### 5. Purchasing & 3-Way Match
* `POST http://localhost:3000/api/v1/purchasing/match-evaluate`
  * **Body**: `{ "vendorBillPrice": 121.50, "vendorBillQty": 100, "tolerancePercentage": 2.0 }`
  * **Returns**: Auto-matched approval or variance exception routing.

### 6. Distributed Temporal Sagas
* `POST http://localhost:3000/api/v1/workflows/o2c/execute`
  * **Happy Path**: `{ "orderId": "SO-2026-9041" }` ➔ 4-step commit (Stock Reserve ➔ Goods Issue ➔ Billing ➔ GL Post).
  * **Fault Simulation**: `{ "orderId": "SO-2026-9041", "scenario": "LEDGER_FAULT_ROLLBACK" }` ➔ Reverse compensation stack executed.

### 7. AI Copilot Studio (LangGraph 3.12)
* `POST http://localhost:3000/api/v1/ai/query`
  * **Body**: `{ "prompt": "Any custom question here..." }`
  * **Returns**: Real-time database grounded answer, mathematical breakdown, audit evidence, and 5-stage Data Lineage Graph.

### 8. Security & Observability
* `GET http://localhost:3000/api/v1/security/penetration-audit` (100% RLS isolation score)
* `GET http://localhost:3000/api/v1/security/audit-logs` (SHA-256 cryptographic chain)
* `GET http://localhost:3000/metrics` (Prometheus & OpenTelemetry metrics exporter)
* `GET http://localhost:3000/api/v1/telemetry/disaster-recovery` (RPO < 1.2s, RTO < 18.4m)

---

## 🗄️ Database Schemas (`database/`)

1. **`01_schema_tenancy_and_iam.sql`**: Multi-tenant RLS tenancy & IAM roles.
2. **`02_schema_accounting_gl.sql`**: Immutable append-only general ledger.
3. **`03_schema_inventory_and_purchasing.sql`**: Stock levels & 3-way match.
4. **`04_schema_outbox_and_events.sql`**: Transactional outbox pattern (ADR-006).
5. **`05_schema_workflows_and_ai.sql`**: Temporal saga states & AI lineage.
6. **`06_schema_audit_and_security.sql`**: SOC 2 Type II SHA-256 cryptographic audit trail.
