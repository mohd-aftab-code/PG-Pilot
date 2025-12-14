-- Insert three default plans into the plans table
-- Run this SQL file to populate initial plans

INSERT INTO plans (name, price, duration_days, max_pgs, max_rooms, max_beds, description) VALUES
('Basic Plan', 999.00, 30, 1, 5, 20, 'Perfect for small PG owners. Manage up to 1 PG with 5 rooms and 20 beds. Ideal for starting your PG management journey.'),
('Standard Plan', 1999.00, 30, 1, 15, 50, 'Best for growing PG businesses. Manage up to 1 PG with 15 rooms and 50 beds. Includes all basic features plus advanced analytics.'),
('Premium Plan', 3999.00, 30, 1, 30, 100, 'For established PG businesses. Manage up to 1 PG with 30 rooms and 100 beds. Full access to all features including priority support.');

