-- Migration: Remove tenant_id and status columns from mess_bills table
-- Date: 2026-01-XX

-- Remove status column (no dependencies)
ALTER TABLE mess_bills DROP COLUMN status;

-- Remove tenant_id column (MySQL will automatically drop foreign key constraint and related indexes)
ALTER TABLE mess_bills DROP COLUMN tenant_id;

