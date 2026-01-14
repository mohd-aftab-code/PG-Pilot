-- Migration: Add schedule column to mess_plans table for day-wise meal scheduling
-- Date: 2026-01-12

-- Add schedule column (JSON) to store day-wise meal plans
ALTER TABLE mess_plans 
ADD COLUMN schedule JSON NULL AFTER price;

-- Example schedule structure:
-- {
--   "monday": { "breakfast": "Poha", "lunch": "Dal Rice", "dinner": "Roti Sabzi" },
--   "tuesday": { "breakfast": "Paratha", "lunch": "Rajma Rice", "dinner": "Chole Rice" },
--   "wednesday": { "breakfast": "Idli", "lunch": "Biryani", "dinner": "Dal Rice" },
--   "thursday": { "breakfast": "Dosa", "lunch": "Dal Rice", "dinner": "Roti Sabzi" },
--   "friday": { "breakfast": "Poha", "lunch": "Chole Rice", "dinner": "Dal Rice" },
--   "saturday": { "breakfast": "Paratha", "lunch": "Rajma Rice", "dinner": "Roti Sabzi" },
--   "sunday": { "breakfast": "Special", "lunch": "Special", "dinner": "Special" }
-- }

