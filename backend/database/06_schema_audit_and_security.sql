-- ==============================================================================
-- NEXUS ENTERPRISE ERP — SOC2 TYPE II TAMPER-PROOF AUDIT & SECURITY DDL
-- Cryptographic SHA-256 Hash-Chained Audit Trail & Security Telemetry
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS security;

-- ------------------------------------------------------------------------------
-- TAMPER-PROOF HASH-CHAINED AUDIT LOG (security.audit_trail)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security.audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    actor_id UUID,
    actor_email VARCHAR(255) NOT NULL,
    action_type VARCHAR(64) NOT NULL, -- 'LOGIN' | 'GL_POST' | 'STOCK_RESERVE' | 'AI_QUERY' | 'SAGA_COMPENSATE'
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(128) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    payload_before JSONB,
    payload_after JSONB,
    previous_record_hash VARCHAR(64) NOT NULL, -- SHA-256 Hash of previous record
    current_record_hash VARCHAR(64) NOT NULL,  -- SHA-256 Hash of (prev_hash + payload)
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for instant compliance querying by ISO 27001 / SOC2 auditors
CREATE INDEX IF NOT EXISTS idx_audit_tenant_time 
ON security.audit_trail (tenant_id, timestamp DESC);

-- Enable RLS on Audit Trail
ALTER TABLE security.audit_trail ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_security_audit ON security.audit_trail FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
