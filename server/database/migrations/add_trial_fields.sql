-- ===============================================
-- MIGRATION: Add Trial Fields to PGS Table
-- ===============================================
-- This migration adds trial support for SaaS-style free trial system
-- Trial starts automatically when PG is registered
-- Trial duration: 30 days

ALTER TABLE pgs 
ADD COLUMN trial_start_date DATE DEFAULT NULL,
ADD COLUMN trial_end_date DATE DEFAULT NULL,
ADD COLUMN subscription_status ENUM('TRIAL', 'ACTIVE', 'EXPIRED') DEFAULT NULL,
ADD INDEX idx_subscription_status (subscription_status),
ADD INDEX idx_trial_end_date (trial_end_date);

-- Update existing PGs that don't have trial dates
-- Set trial_start_date to created_at and trial_end_date to created_at + 30 days
-- Set subscription_status based on whether they have active subscription
UPDATE pgs p
LEFT JOIN pg_subscriptions ps ON p.id = ps.pg_id AND ps.expiry_date >= CURDATE()
SET 
  p.trial_start_date = COALESCE(p.trial_start_date, DATE(p.created_at)),
  p.trial_end_date = COALESCE(p.trial_end_date, DATE_ADD(DATE(p.created_at), INTERVAL 30 DAY)),
  p.subscription_status = CASE 
    WHEN ps.id IS NOT NULL THEN 'ACTIVE'
    WHEN DATE_ADD(DATE(p.created_at), INTERVAL 30 DAY) < CURDATE() THEN 'EXPIRED'
    ELSE 'TRIAL'
  END
WHERE p.trial_start_date IS NULL;

