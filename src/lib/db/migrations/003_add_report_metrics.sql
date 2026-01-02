-- Add average_order_value to monthly_reports
-- Path: src/lib/db/migrations/003_add_report_metrics.sql

ALTER TABLE monthly_reports 
ADD COLUMN average_order_value DECIMAL(10,2) DEFAULT 0;

-- Comment: This allows tracking "Panier Moyen" as requested.
