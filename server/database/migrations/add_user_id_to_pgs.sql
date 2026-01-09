-- ===============================================
-- MIGRATION: Add user_id to PGS Table
-- ===============================================
-- This migration adds user_id column to pgs table for bidirectional relationship
-- users.pg_id → pgs.id (already exists)
-- pgs.user_id → users.id (new)

ALTER TABLE pgs 
ADD COLUMN user_id BIGINT DEFAULT NULL,
ADD INDEX idx_user_id (user_id),
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Update existing PGs to set user_id based on users.pg_id relationship
-- This creates the bidirectional relationship for existing data
UPDATE pgs p
INNER JOIN users u ON u.pg_id = p.id
SET p.user_id = u.id
WHERE p.user_id IS NULL;

