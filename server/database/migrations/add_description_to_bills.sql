-- Migration: Add description column to bills table
-- Date: 2026-01-XX

-- Add description column to store bill description/notes
ALTER TABLE bills 
ADD COLUMN description TEXT NULL AFTER bill_month;

