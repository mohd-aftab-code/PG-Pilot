-- Migration: Change bill_type from ENUM to VARCHAR to allow any text value
-- Date: 2026-01-XX

-- Change bill_type column from ENUM to VARCHAR(100) to allow any bill type
ALTER TABLE bills 
MODIFY COLUMN bill_type VARCHAR(100) NOT NULL;

