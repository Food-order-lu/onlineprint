-- Add commission settings to clients
ALTER TABLE clients 
ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 7.00, -- Default % (e.g. 7%)
ADD COLUMN fixed_fee_amount DECIMAL(10,2) DEFAULT 60.00, -- Default fixed fee
ADD COLUMN is_new_client_model BOOLEAN DEFAULT TRUE, -- Use 60€ vs % logic
ADD COLUMN commission_threshold DECIMAL(10,2) DEFAULT 1000.00; -- Threshold for % switch

-- Create table for monthly reports (parsed from emails)
CREATE TABLE monthly_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    report_month DATE NOT NULL, -- First of the month (e.g. 2025-01-01)
    
    -- Extracted Data
    turnover DECIMAL(10,2) NOT NULL DEFAULT 0, -- Chiffre d'Affaires
    orders_count INTEGER DEFAULT 0,
    
    -- Calculated Commission
    commission_type VARCHAR(50) DEFAULT 'percentage', -- 'fixed' or 'percentage'
    commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processed', 'invoiced'
    invoice_id UUID REFERENCES invoices(id),
    
    raw_data JSONB, -- Store full email data just in case
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one report per client per month
CREATE UNIQUE INDEX idx_monthly_reports_client_month ON monthly_reports(client_id, report_month);
