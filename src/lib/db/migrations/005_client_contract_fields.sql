-- Database Migration 005: Add Contract Fields to Clients Table
-- Description: Adds contract_duration_months and contract_renewal_type to clients table

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS contract_duration_months INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS contract_renewal_type TEXT DEFAULT 'Tacite';

COMMENT ON COLUMN clients.contract_duration_months IS 'Duration of the engagement in months (e.g. 12, 24, 36)';
COMMENT ON COLUMN clients.contract_renewal_type IS 'Type of renewal (e.g. Tacite, Manuel)';
