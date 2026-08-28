-- ==============================================================================
-- NEXUS ENTERPRISE ERP — INVENTORY & PURCHASING DDL MIGRATION
-- Multi-Warehouse Availability Engine, FIFO Valuation Layers & 3-Way Match
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS purchasing;

-- ------------------------------------------------------------------------------
-- INVENTORY DOMAIN (inventory.*)
-- ------------------------------------------------------------------------------

-- Master Warehouses
CREATE TABLE IF NOT EXISTS inventory.warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL, -- e.g. 'WH-CENTRAL-01'
    name VARCHAR(255) NOT NULL,
    address JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_warehouse_code UNIQUE (tenant_id, code)
);

-- Master Items / Products
CREATE TABLE IF NOT EXISTS inventory.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    sku VARCHAR(64) NOT NULL, -- e.g. 'SKU-8890'
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64),
    valuation_method VARCHAR(16) NOT NULL DEFAULT 'FIFO', -- FIFO | LIFO | WAC | STANDARD
    base_uom VARCHAR(16) NOT NULL DEFAULT 'PCS',
    safety_stock_threshold NUMERIC(14, 2) NOT NULL DEFAULT 100.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_item_sku UNIQUE (tenant_id, sku)
);

-- Stock Level Aggregates (Row-Level Locking Target)
CREATE TABLE IF NOT EXISTS inventory.stock_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
    item_id UUID NOT NULL REFERENCES inventory.items(id),
    on_hand_qty NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    reserved_qty NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    incoming_qty NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    version INT NOT NULL DEFAULT 1, -- Optimistic locking version
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_wh_item UNIQUE (tenant_id, warehouse_id, item_id),
    CONSTRAINT chk_non_negative_reserved CHECK (reserved_qty >= 0),
    CONSTRAINT chk_on_hand_gt_reserved CHECK (on_hand_qty >= 0)
);

-- FIFO Valuation Layers Queue Table
CREATE TABLE IF NOT EXISTS inventory.valuation_layers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
    item_id UUID NOT NULL REFERENCES inventory.items(id),
    layer_number INT NOT NULL,
    received_date DATE NOT NULL,
    original_qty NUMERIC(14, 2) NOT NULL,
    remaining_qty NUMERIC(14, 2) NOT NULL,
    unit_cost NUMERIC(18, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_exhausted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_remaining_qty CHECK (remaining_qty >= 0)
);

-- ------------------------------------------------------------------------------
-- PURCHASING DOMAIN (purchasing.*)
-- ------------------------------------------------------------------------------

-- Purchase Orders (PO)
CREATE TABLE IF NOT EXISTS purchasing.purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    po_number VARCHAR(64) NOT NULL, -- e.g. 'PO-2026-1102'
    vendor_id UUID NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'APPROVED', -- DRAFT | APPROVED | RECEIVED | BILLED | CLOSED
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    subtotal NUMERIC(18, 4) NOT NULL,
    tax_total NUMERIC(18, 4) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(18, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_po_number UNIQUE (tenant_id, po_number)
);

-- Goods Receipt Notes (GRN)
CREATE TABLE IF NOT EXISTS purchasing.goods_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    grn_number VARCHAR(64) NOT NULL, -- e.g. 'GRN-2026-994'
    purchase_order_id UUID NOT NULL REFERENCES purchasing.purchase_orders(id),
    warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
    receipt_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'INSPECTED_ACCEPTED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vendor Invoices (AP Bills)
CREATE TABLE IF NOT EXISTS purchasing.vendor_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenancy.tenants(id) ON DELETE CASCADE,
    bill_number VARCHAR(64) NOT NULL, -- e.g. 'INV-8892'
    purchase_order_id UUID NOT NULL REFERENCES purchasing.purchase_orders(id),
    goods_receipt_id UUID REFERENCES purchasing.goods_receipts(id),
    bill_date DATE NOT NULL,
    total_amount NUMERIC(18, 4) NOT NULL,
    match_status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING | AUTO_MATCHED | EXCEPTION | APPROVED
    variance_percentage NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
