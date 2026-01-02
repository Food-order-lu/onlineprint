-- Add client categorization and sophisticated billing rules
-- Path: src/lib/db/migrations/002_enhance_billing_rules.sql

-- 1. Client Types & VAT Modes
CREATE TYPE client_category AS ENUM ('legacy', 'new');
CREATE TYPE vat_mode AS ENUM ('luxembourg', 'auto_liquidation', 'private_individual');

-- 2. Add columns to clients table
ALTER TABLE clients 
ADD COLUMN category client_category DEFAULT 'new',
ADD COLUMN vat_mode vat_mode DEFAULT 'luxembourg',

-- Commission Configuration (Replacing simple fields with JSONB for flexibility)
ADD COLUMN commission_config JSONB DEFAULT '{ "type": "hybrid", "base_fee": 60.0, "threshold": 1000.0, "percent_above": 7.0 }'::JSONB;

-- 3. Commercial Objectives Table (to track monthly targets)
CREATE TABLE commercial_objectives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month DATE NOT NULL UNIQUE, -- First of the month (e.g., 2025-01-01)
    
    target_new_clients INTEGER DEFAULT 14,
    min_new_clients INTEGER DEFAULT 10,
    
    actual_new_clients INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for objectives
CREATE INDEX idx_objectives_month ON commercial_objectives(month);
