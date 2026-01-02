-- Migration: Add zoho_contact_id to clients table
-- Created at: 2026-01-02

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS zoho_contact_id TEXT;

COMMENT ON COLUMN clients.zoho_contact_id IS 'ID of the contact in Zoho Books';
