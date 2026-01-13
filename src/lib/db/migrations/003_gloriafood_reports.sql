-- Migration: Create gloriafood_reports table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS gloriafood_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(255), -- For unmatched clients
    report_month VARCHAR(7) NOT NULL, -- YYYY-MM format
    total_orders INTEGER DEFAULT 0,
    average_order DECIMAL(10,2) DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    commission_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, ready, invoiced
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by month
CREATE INDEX IF NOT EXISTS idx_gloriafood_reports_month ON gloriafood_reports(report_month);
CREATE INDEX IF NOT EXISTS idx_gloriafood_reports_client ON gloriafood_reports(client_id);

-- Unique constraint to prevent duplicate reports per client/month
CREATE UNIQUE INDEX IF NOT EXISTS idx_gloriafood_reports_unique 
ON gloriafood_reports(client_id, report_month) 
WHERE client_id IS NOT NULL;

-- Enable RLS
ALTER TABLE gloriafood_reports ENABLE ROW LEVEL SECURITY;

-- Policy for service role (full access)
CREATE POLICY "Service role has full access" ON gloriafood_reports
    FOR ALL USING (true) WITH CHECK (true);
