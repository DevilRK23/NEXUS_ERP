-- ==============================================================================
-- NEXUS ENTERPRISE ERP — TEMPORAL SAGAS, HCM PAYROLL & AI LINEAGE (ADR-007 & ADR-014)
-- Distributed Transaction State Machine, Calculation Traces & AI Audit Graphs
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS workflows;
CREATE SCHEMA IF NOT EXISTS payroll;
CREATE SCHEMA IF NOT EXISTS ai;

-- ------------------------------------------------------------------------------
-- TEMPORAL SAGAS DOMAIN (workflows.*)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflows.saga_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    workflow_id VARCHAR(128) NOT NULL, -- e.g. 'O2C-SO-2026-9041'
    workflow_type VARCHAR(64) NOT NULL DEFAULT 'ORDER_TO_CASH_SAGA',
    status VARCHAR(32) NOT NULL DEFAULT 'RUNNING', -- RUNNING | COMPLETED | COMPENSATING | COMPENSATED | FAILED
    current_step INT NOT NULL DEFAULT 1,
    total_steps INT NOT NULL DEFAULT 4,
    execution_timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    error_details JSONB,
    compensation_reason VARCHAR(255),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT uq_tenant_workflow UNIQUE (tenant_id, workflow_id)
);

-- ------------------------------------------------------------------------------
-- PAYROLL DOMAIN (payroll.*)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payroll.payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    period_id VARCHAR(32) NOT NULL, -- 'FY2026-08'
    total_gross NUMERIC(18, 4) NOT NULL,
    total_deductions NUMERIC(18, 4) NOT NULL,
    total_net NUMERIC(18, 4) NOT NULL,
    employee_count INT NOT NULL DEFAULT 1,
    status VARCHAR(32) NOT NULL DEFAULT 'POSTED',
    calculation_trace JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- AI & LINEAGE DOMAIN (ai.*)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai.audit_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    user_id UUID,
    prompt TEXT NOT NULL,
    engine VARCHAR(64) NOT NULL DEFAULT 'LangGraph-3.12',
    response_summary TEXT NOT NULL,
    proposal_object JSONB NOT NULL DEFAULT '{}'::jsonb,
    lineage_nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    human_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
