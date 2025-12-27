-- Rivego Automation System - Database Schema
-- Compatible with Supabase (PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE client_status AS ENUM ('active', 'inactive', 'pending_cancellation');
CREATE TYPE client_type AS ENUM ('legacy', 'new');
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled');
CREATE TYPE service_type AS ENUM ('hosting', 'online_ordering', 'table_reservation', 'website', 'maintenance', 'other');
CREATE TYPE mandate_status AS ENUM ('pending', 'active', 'cancelled', 'failed');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE contract_status AS ENUM ('draft', 'sent', 'signed', 'expired', 'cancelled');
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'signed', 'expired', 'declined');

-- =============================================================================
-- CLIENTS TABLE
-- =============================================================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Luxembourg',
    vat_number VARCHAR(50),
    
    -- Status & Type
    status client_status DEFAULT 'active',
    client_type client_type DEFAULT 'new',
    
    -- Cancellation tracking
    cancellation_requested_at TIMESTAMPTZ,
    cancellation_effective_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    cancellation_signed_at TIMESTAMPTZ,
    
    -- Exception flags (for special cases)
    sepa_exception BOOLEAN DEFAULT FALSE,
    sepa_exception_reason TEXT,
    
    -- Internal notes (hidden from client view)
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_type ON clients(client_type);
CREATE INDEX idx_clients_email ON clients(email);

-- =============================================================================
-- SUBSCRIPTIONS TABLE (Monthly recurring services)
-- =============================================================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    service_type service_type NOT NULL,
    service_name VARCHAR(255), -- Custom name if needed
    description TEXT,
    
    -- Pricing
    monthly_amount DECIMAL(10,2) NOT NULL,
    commission_percent DECIMAL(5,2) DEFAULT 0, -- For GloriaFood commission
    
    -- Status
    status subscription_status DEFAULT 'active',
    
    -- Dates
    started_at DATE DEFAULT CURRENT_DATE,
    cancelled_at DATE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- =============================================================================
-- ONE-TIME CHARGES TABLE (Supplements / Ponctuels)
-- =============================================================================

CREATE TABLE one_time_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    
    -- Invoice tracking
    invoiced BOOLEAN DEFAULT FALSE,
    invoice_id UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_one_time_charges_client ON one_time_charges(client_id);
CREATE INDEX idx_one_time_charges_invoiced ON one_time_charges(invoiced);

-- =============================================================================
-- GOCARDLESS MANDATES TABLE (SEPA Direct Debit)
-- =============================================================================

CREATE TABLE gocardless_mandates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- GoCardless IDs
    mandate_id VARCHAR(100) UNIQUE,
    customer_id VARCHAR(100),
    billing_request_id VARCHAR(100),
    
    -- Status
    status mandate_status DEFAULT 'pending',
    
    -- Bank info (partial for display)
    iban_last4 VARCHAR(4),
    bank_name VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

CREATE INDEX idx_mandates_client ON gocardless_mandates(client_id);
CREATE INDEX idx_mandates_status ON gocardless_mandates(status);
CREATE UNIQUE INDEX idx_mandates_mandate_id ON gocardless_mandates(mandate_id);

-- =============================================================================
-- INVOICES TABLE
-- =============================================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- Period (for monthly invoices)
    period_start DATE,
    period_end DATE,
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 17.00, -- Luxembourg VAT
    vat_amount DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    
    -- Status
    status invoice_status DEFAULT 'draft',
    
    -- External references
    external_id VARCHAR(100), -- Zoho/Odoo invoice ID
    external_provider VARCHAR(50), -- 'zoho' or 'odoo'
    gocardless_payment_id VARCHAR(100),
    
    -- Dates
    issued_at DATE DEFAULT CURRENT_DATE,
    due_at DATE,
    paid_at DATE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- =============================================================================
-- INVOICE ITEMS TABLE
-- =============================================================================

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    description VARCHAR(500) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    
    -- Reference to subscription or one-time charge
    subscription_id UUID REFERENCES subscriptions(id),
    one_time_charge_id UUID REFERENCES one_time_charges(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- =============================================================================
-- GLORIAFOOD REPORTS TABLE
-- =============================================================================

CREATE TABLE gloriafood_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Report data
    report_month DATE NOT NULL, -- First day of the month
    total_ttc DECIMAL(10,2) NOT NULL,
    commission_percent DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    
    -- Processing
    email_subject TEXT,
    email_received_at TIMESTAMPTZ,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    invoice_id UUID REFERENCES invoices(id),
    
    -- Raw data for debugging
    raw_email_content TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gloriafood_reports_client ON gloriafood_reports(client_id);
CREATE INDEX idx_gloriafood_reports_month ON gloriafood_reports(report_month);
CREATE INDEX idx_gloriafood_reports_processed ON gloriafood_reports(processed);
CREATE UNIQUE INDEX idx_gloriafood_reports_unique ON gloriafood_reports(client_id, report_month);

-- =============================================================================
-- QUOTES TABLE (Devis)
-- =============================================================================

CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    quote_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- Client info (stored separately in case client not yet created)
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    client_company VARCHAR(255),
    
    -- Quote content
    items JSONB NOT NULL DEFAULT '[]',
    
    -- Flags
    has_recurring BOOLEAN DEFAULT FALSE, -- Has monthly subscriptions?
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 17.00,
    vat_amount DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    
    -- Discount (hidden from client)
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    internal_margin_notes TEXT, -- Admin notes about pricing
    
    -- Status
    status quote_status DEFAULT 'draft',
    
    -- Dates
    valid_until DATE,
    signed_at TIMESTAMPTZ,
    
    -- Signature
    signature_data TEXT, -- Base64 signature image
    signer_ip VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quotes_client ON quotes(client_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_number ON quotes(quote_number);

-- =============================================================================
-- CONTRACTS TABLE
-- =============================================================================

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    
    contract_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- DocuSeal integration
    docuseal_submission_id VARCHAR(100),
    docuseal_template_id VARCHAR(100),
    
    -- Status
    status contract_status DEFAULT 'draft',
    
    -- Contract content
    services JSONB DEFAULT '[]', -- List of services included
    terms TEXT, -- Custom terms if any
    
    -- Dates
    start_date DATE,
    end_date DATE, -- NULL for indefinite
    signed_at TIMESTAMPTZ,
    
    -- Files
    pdf_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contracts_client ON contracts(client_id);
CREATE INDEX idx_contracts_quote ON contracts(quote_id);
CREATE INDEX idx_contracts_status ON contracts(status);

-- =============================================================================
-- CANCELLATION REQUESTS TABLE
-- =============================================================================

CREATE TABLE cancellation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- What to cancel
    cancel_type VARCHAR(50) NOT NULL, -- 'full' or 'service'
    subscription_id UUID REFERENCES subscriptions(id), -- If cancelling specific service
    
    -- Request details
    reason TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Signature
    token VARCHAR(255) UNIQUE, -- For signature link
    signed_at TIMESTAMPTZ,
    signature_data TEXT,
    signer_ip VARCHAR(50),
    
    -- Effective date (2 months after signature)
    effective_at DATE,
    
    -- Status
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_cancellation_client ON cancellation_requests(client_id);
CREATE INDEX idx_cancellation_token ON cancellation_requests(token);

-- =============================================================================
-- AUDIT LOG TABLE (for tracking changes)
-- =============================================================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    entity_type VARCHAR(50) NOT NULL, -- 'client', 'subscription', etc.
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
    
    old_values JSONB,
    new_values JSONB,
    
    performed_by VARCHAR(255), -- Admin email or 'system'
    performed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_log(performed_at);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) for Supabase
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_time_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE gocardless_mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gloriafood_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Admin can do everything (we'll create admin role later)
-- Client can only see their own data

-- Example policy for clients table (more will be added during auth setup)
-- CREATE POLICY "Admins can do anything" ON clients
--     FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- CREATE POLICY "Clients can view own data" ON clients
--     FOR SELECT USING (auth.uid()::text = id::text);
