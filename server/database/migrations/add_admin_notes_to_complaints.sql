-- Migration: Add admin_notes column to complaints table
-- Date: 2026-01-XX

-- Add admin_notes column to store admin's notes when updating complaint status
ALTER TABLE complaints 
ADD COLUMN admin_notes TEXT NULL AFTER status;

