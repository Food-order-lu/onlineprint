
-- Add payment_method to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('sepa', 'manual', 'card', 'transfer')) DEFAULT 'sepa';

COMMENT ON COLUMN clients.payment_method IS 'Preferred payment method: sepa, manual, etc.';

-- Update existing clients based on sepa_exception
UPDATE clients
SET payment_method = 'manual'
WHERE sepa_exception = true;
