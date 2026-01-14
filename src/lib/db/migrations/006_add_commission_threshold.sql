-- Add commission_threshold column to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS commission_threshold DECIMAL(10, 2) DEFAULT 0;
