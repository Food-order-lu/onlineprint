-- Add Referral Columns to Clients Table

-- 1. Add referral_code (Unique identifier, e.g. VAT number)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- 2. Add referred_by (Link to the referrer client)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES clients(id);

-- 3. Index for performance
CREATE INDEX IF NOT EXISTS idx_clients_referral_code ON clients(referral_code);
CREATE INDEX IF NOT EXISTS idx_clients_referred_by ON clients(referred_by);

-- 4. Comment
COMMENT ON COLUMN clients.referral_code IS 'Unique code for referrals, defaults to VAT Number';
COMMENT ON COLUMN clients.referred_by IS 'UUID of the client who referred this client';
