-- Migration: Add description column to mess_bills table
-- Date: 2026-01-12

-- Add description column to store bill description/notes
ALTER TABLE mess_bills 
ADD COLUMN description TEXT NULL AFTER amount;

