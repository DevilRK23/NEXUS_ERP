-- ==============================================================================
-- NEXUS ENTERPRISE ERP — GENERAL LEDGER & ACCOUNTING DDL MIGRATION (ADR-009)
-- Single Source of Financial Truth, Gapless Sequence & Immutability Enforcement
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS accounting;

-- ------------------------------------------------------------------------------
-- CHART OF ACCOUNTS (COA)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES tenancy.organizations(id),
    code VARCHAR(32) NOT NULL, -- e.g., '1110', '1200', '2010', '4010'
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL, -- ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE
    normal_balance VARCHAR(8) NOT NULL, -- DEBIT | CREDIT
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    parent_account_id UUID REFERENCES accounting.accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_company_account_code UNIQUE (tenant_id, company_id, code)
);

ALTER TABLE accounting.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_accounting_accounts ON accounting.accounts FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- ------------------------------------------------------------------------------
-- FISCAL PERIODS (CALENDAR)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting.fiscal_periods (
    id VARCHAR(32) PRIMARY KEY, -- e.g. 'FY2026-08'
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    fiscal_year INT NOT NULL,
    period_number INT NOT NULL, -- 1 to 12
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    locked_at TIMESTAMPTZ,
    locked_by UUID,
    CONSTRAINT uq_tenant_fiscal_period UNIQUE (tenant_id, fiscal_year, period_number)
);

ALTER TABLE accounting.fiscal_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_accounting_periods ON accounting.fiscal_periods FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- ------------------------------------------------------------------------------
-- GAPLESS SEQUENCE GENERATOR TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting.sequence_generators (
    tenant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    fiscal_year INT NOT NULL,
    prefix VARCHAR(16) NOT NULL DEFAULT 'JE',
    last_sequence BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, company_id, fiscal_year, prefix)
);

-- ------------------------------------------------------------------------------
-- IMMUTABLE JOURNAL ENTRY HEADERS (accounting.journal_entry)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting.journal_entry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES tenancy.organizations(id),
    entry_number VARCHAR(64) NOT NULL, -- Format: JE-YYYY-NNNNNN
    period_id VARCHAR(32) NOT NULL,
    posting_date DATE NOT NULL,
    description TEXT NOT NULL,
    source_module VARCHAR(32) NOT NULL DEFAULT 'MANUAL', -- MANUAL | SALES_O2C | INVENTORY | PAYROLL | AP_BILL
    source_reference_id VARCHAR(128),
    status VARCHAR(32) NOT NULL DEFAULT 'POSTED', -- POSTED | REVERSED
    is_reversal BOOLEAN NOT NULL DEFAULT FALSE,
    reversal_of_entry_id UUID REFERENCES accounting.journal_entry(id),
    total_debit NUMERIC(18, 4) NOT NULL,
    total_credit NUMERIC(18, 4) NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_company_entry_no UNIQUE (tenant_id, company_id, entry_number)
);

ALTER TABLE accounting.journal_entry ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_accounting_journal_entry ON accounting.journal_entry FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- ------------------------------------------------------------------------------
-- JOURNAL ENTRY LINES (accounting.journal_line)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting.journal_line (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    journal_entry_id UUID NOT NULL REFERENCES accounting.journal_entry(id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    account_id UUID NOT NULL REFERENCES accounting.accounts(id),
    debit_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    credit_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    exchange_rate NUMERIC(12, 6) NOT NULL DEFAULT 1.000000,
    dimension_department VARCHAR(64),
    dimension_project VARCHAR(64),
    memo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_debit_or_credit CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR
        (credit_amount > 0 AND debit_amount = 0)
    )
);

ALTER TABLE accounting.journal_line ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_accounting_journal_line ON accounting.journal_line FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- ------------------------------------------------------------------------------
-- IMMUTABILITY & STATUTORY TRIGGER ENFORCEMENT (BR-03.01 & BR-03.02)
-- ------------------------------------------------------------------------------

-- Trigger 1: Reject ANY modification or deletion of posted entries (BR-03.02)
CREATE OR REPLACE FUNCTION accounting.prevent_gl_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'BR-03.02_IMMUTABILITY_VIOLATION: Posted journal entries are strictly immutable by enterprise audit standards. Submit an explicit reversing entry instead.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_journal_entry ON accounting.journal_entry;
CREATE TRIGGER trg_immutable_journal_entry
BEFORE UPDATE OR DELETE ON accounting.journal_entry
FOR EACH ROW EXECUTE FUNCTION accounting.prevent_gl_mutation();

DROP TRIGGER IF EXISTS trg_immutable_journal_line ON accounting.journal_line;
CREATE TRIGGER trg_immutable_journal_line
BEFORE UPDATE OR DELETE ON accounting.journal_line
FOR EACH ROW EXECUTE FUNCTION accounting.prevent_gl_mutation();
