-- ==============================================================================
-- NEXUS ENTERPRISE ERP — PHASE 1 DDL MIGRATION
-- Multi-Tenancy Registry, PostgreSQL Row-Level Security (RLS) & IAM Authentication
-- ==============================================================================

-- 1. Create Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Create Schema Namespaces
CREATE SCHEMA IF NOT EXISTS tenancy;
CREATE SCHEMA IF NOT EXISTS iam;

-- ------------------------------------------------------------------------------
-- TENANCY DOMAIN (tenancy.*)
-- ------------------------------------------------------------------------------

-- Master Tenancy Registry Table
CREATE TABLE IF NOT EXISTS tenancy.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    tier VARCHAR(32) NOT NULL DEFAULT 'tier_2_dedicated_schema', -- tier_1_pooled | tier_2_dedicated_schema | tier_3_dedicated_vpc
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- active | suspended | provisioning
    custom_domain VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Legal Entities / Subsidiaries Table (Multi-Company Hierarchy)
CREATE TABLE IF NOT EXISTS tenancy.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    parent_org_id UUID REFERENCES tenancy.organizations(id),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    tax_identifier VARCHAR(64),
    functional_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_holding_company BOOLEAN NOT NULL DEFAULT FALSE,
    fiscal_year_start_month INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_org UNIQUE (tenant_id, name)
);

-- Enable RLS on Organizations
ALTER TABLE tenancy.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy_orgs ON tenancy.organizations
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- ------------------------------------------------------------------------------
-- IAM & IDENTITY DOMAIN (iam.*)
-- ------------------------------------------------------------------------------

-- Master Users Table
CREATE TABLE IF NOT EXISTS iam.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255), -- Argon2id hash
    auth_provider VARCHAR(32) NOT NULL DEFAULT 'local', -- local | okta | azure_ad | saml
    external_provider_id VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_user_email UNIQUE (tenant_id, email)
);

-- Enterprise Roles (RBAC)
CREATE TABLE IF NOT EXISTS iam.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL, -- Financial_Controller | AP_Clerk | CFO | Auditor | Ops_Manager
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_role UNIQUE (tenant_id, name)
);

-- User Role Assignments
CREATE TABLE IF NOT EXISTS iam.user_roles (
    user_id UUID NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES iam.roles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- Active Refresh Tokens
CREATE TABLE IF NOT EXISTS iam.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on IAM tables
ALTER TABLE iam.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.refresh_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy_users ON iam.users
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_policy_roles ON iam.roles
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_policy_user_roles ON iam.user_roles
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_policy_refresh ON iam.refresh_tokens
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- ------------------------------------------------------------------------------
-- RLS TRANSACTION HELPER FUNCTIONS
-- ------------------------------------------------------------------------------

-- Helper to retrieve active tenant ID in SQL
CREATE OR REPLACE FUNCTION tenancy.current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.tenant_id', true), '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper to set active tenant context for a transaction
CREATE OR REPLACE FUNCTION tenancy.set_tenant_context(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.tenant_id', p_tenant_id::text, true);
END;
$$ LANGUAGE plpgsql;
