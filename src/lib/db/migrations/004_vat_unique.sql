-- Migration: Add UNIQUE constraint on vat_number
-- Run this in Supabase SQL Editor

-- First, check for existing duplicates
SELECT vat_number, COUNT(*) as count
FROM clients
WHERE vat_number IS NOT NULL AND vat_number != ''
GROUP BY vat_number
HAVING COUNT(*) > 1;

-- If no duplicates, add the constraint
-- Note: We use a partial unique index to allow multiple NULLs and empty strings
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_vat_number_unique
ON clients (vat_number)
WHERE vat_number IS NOT NULL AND vat_number != '';

-- This allows:
-- - Multiple clients without VAT number (NULL or empty)
-- - Only ONE client per unique VAT number
