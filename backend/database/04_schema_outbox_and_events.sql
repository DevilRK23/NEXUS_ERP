-- ==============================================================================
-- NEXUS ENTERPRISE ERP — TRANSACTIONAL OUTBOX & EVENT MESH (ADR-006)
-- Guarantees At-Least-Once Delivery to Kafka/Redpanda with Zero Dual-Write Bugs
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS eventing;

-- ------------------------------------------------------------------------------
-- TRANSACTIONAL OUTBOX TABLE (eventing.outbox)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eventing.outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    aggregate_type VARCHAR(64) NOT NULL, -- 'JournalEntry' | 'SalesOrder' | 'StockMovement'
    aggregate_id VARCHAR(128) NOT NULL,
    event_type VARCHAR(128) NOT NULL, -- 'erp.accounting.journal.posted.v1'
    payload JSONB NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING | PUBLISHED | FAILED
    retry_count INT NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for high-throughput CDC polling by Debezium
CREATE INDEX IF NOT EXISTS idx_outbox_pending 
ON eventing.outbox (created_at) 
WHERE status = 'PENDING';

-- Enable RLS on Outbox
ALTER TABLE eventing.outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_eventing_outbox ON eventing.outbox FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- ------------------------------------------------------------------------------
-- IDEMPOTENT CONSUMER DEDUPLICATION LOG (eventing.processed_messages)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eventing.processed_messages (
    message_id UUID PRIMARY KEY,
    consumer_group VARCHAR(128) NOT NULL,
    topic VARCHAR(128) NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
