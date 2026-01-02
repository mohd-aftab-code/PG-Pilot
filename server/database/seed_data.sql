-- ===============================================
-- PG-PILOT FINAL CLEAN SEED DATA
-- No Duplicates, Optimized, Ready for Production
-- ===============================================

SET FOREIGN_KEY_CHECKS=0;

-- Clear existing data (optional - comment out if you want to keep existing data)
TRUNCATE TABLE pg_lead_metrics;
TRUNCATE TABLE booking_inquiries;
TRUNCATE TABLE pg_facilities;
TRUNCATE TABLE tenant_users;
TRUNCATE TABLE bill_allocations;
TRUNCATE TABLE bills;
TRUNCATE TABLE mess_bills;
TRUNCATE TABLE tenant_mess;
TRUNCATE TABLE mess_plans;
TRUNCATE TABLE payments;
TRUNCATE TABLE tenants;
TRUNCATE TABLE beds;
TRUNCATE TABLE rooms;
TRUNCATE TABLE invoices;
TRUNCATE TABLE pg_subscriptions;
TRUNCATE TABLE referrals;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE complaints;
TRUNCATE TABLE users;
TRUNCATE TABLE pgs;
TRUNCATE TABLE plans;
TRUNCATE TABLE coupons;

SET FOREIGN_KEY_CHECKS=1;

-- =====================================
-- 1) PLANS
-- =====================================
INSERT INTO plans (id, name, price, duration_days, max_pgs, max_rooms, max_beds, description) VALUES
(1, 'Basic Plan', 999.00, 30, 1, 5, 20, 'Perfect for small PG owners. Manage up to 1 PG with 5 rooms and 20 beds.'),
(2, 'Standard Plan', 1999.00, 30, 1, 15, 50, 'Best for growing PG businesses. Manage up to 1 PG with 15 rooms and 50 beds.'),
(3, 'Premium Plan', 3999.00, 30, 1, 30, 100, 'For established PG businesses. Manage up to 1 PG with 30 rooms and 100 beds.')
ON DUPLICATE KEY UPDATE 
  name=VALUES(name),
  price=VALUES(price),
  duration_days=VALUES(duration_days),
  max_pgs=VALUES(max_pgs),
  max_rooms=VALUES(max_rooms),
  max_beds=VALUES(max_beds),
  description=VALUES(description);

-- =====================================
-- 2) PGS (11 PGs in different cities)
-- Must be inserted before Users due to foreign key constraint
-- =====================================
INSERT INTO pgs (id, pg_uid, name, address, city, area, pincode, food_enabled, default_due_day, created_at) VALUES
(1, 'PG10001', 'Comfort Stay PG', '12, Karol Bagh, Delhi', 'Delhi', 'Karol Bagh', '110005', 1, 5, NOW()),
(2, 'PG10002', 'Urban Nest PG', '45, Lajpat Nagar, Delhi', 'Delhi', 'Lajpat Nagar', '110024', 1, 5, NOW()),
(3, 'PG10003', 'City Comfort PG', '101, Andheri, Mumbai', 'Mumbai', 'Andheri', '400053', 0, 7, NOW()),
(4, 'PG10004', 'Student Hub PG', '220, Koramangala, Bangalore', 'Bangalore', 'Koramangala', '560034', 1, 5, NOW()),
(5, 'PG10005', 'Metro Stay PG', '88, HSR Layout, Bangalore', 'Bangalore', 'HSR Layout', '560102', 1, 5, NOW()),
(6, 'PG10006', 'Elite Homes PG', '15, Aundh, Pune', 'Pune', 'Aundh', '411007', 0, 5, NOW()),
(7, 'PG10007', 'Green View PG', '70, Gachibowli, Hyderabad', 'Hyderabad', 'Gachibowli', '500032', 1, 5, NOW()),
(8, 'PG10008', 'Sunrise PG', '33, Adyar, Chennai', 'Chennai', 'Adyar', '600020', 0, 6, NOW()),
(9, 'PG10009', 'Lakeside PG', '5, Salt Lake, Kolkata', 'Kolkata', 'Salt Lake', '700091', 1, 5, NOW()),
(10, 'PG10010', 'Harmony PG', '10, Sector 62, Noida', 'Noida', 'Sector 62', '201301', 1, 5, NOW()),
(11, 'PG10011', 'test-001', 'Noida Uttar Pradesh', 'Noida', 'Sector 44', '201301', 0, 5, NOW())
ON DUPLICATE KEY UPDATE 
  name=VALUES(name),
  address=VALUES(address),
  city=VALUES(city),
  area=VALUES(area),
  pincode=VALUES(pincode),
  food_enabled=VALUES(food_enabled),
  default_due_day=VALUES(default_due_day);

-- =====================================
-- 3) USERS (PG Admins)
-- Password for ALL users: password123
-- Inserted after PGs to satisfy foreign key constraint
-- =====================================
INSERT INTO users (id, pg_id, name, email, phone, password_hash, role, created_at) VALUES
(1, NULL, 'Super Admin', 'superadmin@pgpilot.com', '9000000000', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'superadmin', NOW()),
(2, 1, 'Rajesh Kumar', 'rajesh@pg1.com', '9876543210', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'pg_admin', NOW()),
(3, 2, 'Priya Sharma', 'priya@pg2.com', '9876543211', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'pg_admin', NOW()),
(4, 3, 'Amit Singh', 'amit@pg3.com', '9876543212', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'pg_admin', NOW()),
(5, 4, 'Sneha Patel', 'sneha@pg4.com', '9876543213', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'pg_admin', NOW()),
(6, 5, 'Vikram Mehta', 'vikram@pg5.com', '9876543214', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'pg_admin', NOW()),
(7, 6, 'Anjali Reddy', 'anjali@pg6.com', '9876543215', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'pg_admin', NOW()),
(8, 7, 'Rohit Verma', 'rohit@pg7.com', '9876543216', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'pg_admin', NOW()),
(9, 8, 'Kavita Nair', 'kavita@pg8.com', '9876543217', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'pg_admin', NOW()),
(10, 9, 'Manish Gupta', 'manish@pg9.com', '9876543218', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'pg_admin', NOW()),
(11, 10, 'Deepika Joshi', 'deepika@pg10.com', '9876543219', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'pg_admin', NOW()),
(12, 11, 'Test Admin', 'test@pg11.com', '9696110243', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'pg_admin', NOW())
ON DUPLICATE KEY UPDATE 
  name=VALUES(name),
  email=VALUES(email),
  phone=VALUES(phone),
  password_hash=VALUES(password_hash),
  role=VALUES(role),
  pg_id=VALUES(pg_id);

-- =====================================
-- 4) PG SUBSCRIPTIONS (All active, NO DUPLICATES)
-- =====================================
INSERT INTO pg_subscriptions (id, pg_id, plan_id, start_date, expiry_date, custom_price) VALUES
(1, 1, 2, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1999.00),
(2, 2, 2, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1999.00),
(3, 3, 3, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 3999.00),
(4, 4, 2, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1999.00),
(5, 5, 2, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1999.00),
(6, 6, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 999.00),
(7, 7, 3, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 3999.00),
(8, 8, 2, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1999.00),
(9, 9, 2, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1999.00),
(10, 10, 2, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1999.00),
(11, 11, 2, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1999.00)
ON DUPLICATE KEY UPDATE 
  plan_id=VALUES(plan_id),
  start_date=VALUES(start_date),
  expiry_date=VALUES(expiry_date),
  custom_price=VALUES(custom_price);

-- =====================================
-- 5) ROOMS (10-20 rooms per PG)
-- =====================================
-- PG 1: 10 rooms
INSERT INTO rooms (id, pg_id, room_name, total_beds, rent_per_bed, gender_type, show_in_marketplace, room_description) VALUES
(1, 1, 'R101', 3, 8000.00, 'unisex', 1, '3 sharing AC room'),
(2, 1, 'R102', 3, 8500.00, 'unisex', 1, '3 sharing premium room'),
(3, 1, 'R103', 2, 9000.00, 'unisex', 1, '2 sharing AC room'),
(4, 1, 'R201', 3, 8000.00, 'unisex', 1, '3 sharing room'),
(5, 1, 'R202', 2, 8500.00, 'unisex', 1, '2 sharing premium'),
(6, 1, 'R301', 3, 8000.00, 'unisex', 1, '3 sharing top floor'),
(7, 1, 'R302', 2, 9000.00, 'unisex', 1, '2 sharing corner'),
(8, 1, 'R401', 3, 8000.00, 'unisex', 1, '3 sharing'),
(9, 1, 'R402', 2, 8500.00, 'unisex', 1, '2 sharing'),
(10, 1, 'R501', 3, 8000.00, 'unisex', 1, '3 sharing');

-- PG 2-10: 5 rooms each (simplified for seed)
INSERT INTO rooms (pg_id, room_name, total_beds, rent_per_bed, gender_type, show_in_marketplace, room_description) VALUES
(2, 'A101', 3, 8500.00, 'female', 1, '3 sharing room'),
(2, 'A102', 2, 9000.00, 'female', 1, '2 sharing room'),
(2, 'A201', 3, 8500.00, 'female', 1, '3 sharing'),
(2, 'A202', 2, 9000.00, 'female', 1, '2 sharing'),
(2, 'A301', 3, 8500.00, 'female', 1, '3 sharing'),
(3, 'B101', 3, 9000.00, 'male', 1, '3 sharing AC'),
(3, 'B102', 2, 9500.00, 'male', 1, '2 sharing AC'),
(3, 'B201', 3, 9000.00, 'male', 1, '3 sharing'),
(3, 'B202', 2, 9500.00, 'male', 1, '2 sharing'),
(3, 'B301', 3, 9000.00, 'male', 1, '3 sharing'),
(4, 'G101', 2, 7500.00, 'unisex', 1, '2 sharing'),
(4, 'G102', 3, 8000.00, 'unisex', 1, '3 sharing'),
(4, 'G201', 2, 7500.00, 'unisex', 1, '2 sharing'),
(4, 'G202', 3, 8000.00, 'unisex', 1, '3 sharing'),
(4, 'G301', 2, 7500.00, 'unisex', 1, '2 sharing'),
(5, 'H101', 3, 8200.00, 'unisex', 1, '3 sharing'),
(5, 'H102', 2, 8700.00, 'unisex', 1, '2 sharing'),
(5, 'H201', 3, 8200.00, 'unisex', 1, '3 sharing'),
(5, 'H202', 2, 8700.00, 'unisex', 1, '2 sharing'),
(5, 'H301', 3, 8200.00, 'unisex', 1, '3 sharing'),
(6, 'P101', 3, 8200.00, 'male', 1, '3 sharing'),
(6, 'P102', 2, 8700.00, 'male', 1, '2 sharing'),
(6, 'P201', 3, 8200.00, 'male', 1, '3 sharing'),
(6, 'P202', 2, 8700.00, 'male', 1, '2 sharing'),
(6, 'P301', 3, 8200.00, 'male', 1, '3 sharing'),
(7, 'HY101', 3, 7800.00, 'unisex', 1, '3 sharing'),
(7, 'HY102', 2, 8300.00, 'unisex', 1, '2 sharing'),
(7, 'HY201', 3, 7800.00, 'unisex', 1, '3 sharing'),
(7, 'HY202', 2, 8300.00, 'unisex', 1, '2 sharing'),
(7, 'HY301', 3, 7800.00, 'unisex', 1, '3 sharing'),
(8, 'C101', 3, 8300.00, 'unisex', 1, '3 sharing'),
(8, 'C102', 2, 8800.00, 'unisex', 1, '2 sharing'),
(8, 'C201', 3, 8300.00, 'unisex', 1, '3 sharing'),
(8, 'C202', 2, 8800.00, 'unisex', 1, '2 sharing'),
(8, 'C301', 3, 8300.00, 'unisex', 1, '3 sharing'),
(9, 'K101', 3, 8800.00, 'male', 1, '3 sharing'),
(9, 'K102', 2, 9300.00, 'male', 1, '2 sharing'),
(9, 'K201', 3, 8800.00, 'male', 1, '3 sharing'),
(9, 'K202', 2, 9300.00, 'male', 1, '2 sharing'),
(9, 'K301', 3, 8800.00, 'male', 1, '3 sharing'),
(10, 'N101', 3, 8200.00, 'unisex', 1, '3 sharing'),
(10, 'N102', 2, 8700.00, 'unisex', 1, '2 sharing'),
(10, 'N201', 3, 8200.00, 'unisex', 1, '3 sharing'),
(10, 'N202', 2, 8700.00, 'unisex', 1, '2 sharing'),
(10, 'N301', 3, 8200.00, 'unisex', 1, '3 sharing');

-- PG 11: 10 rooms (test-001)
INSERT INTO rooms (pg_id, room_name, total_beds, rent_per_bed, gender_type, show_in_marketplace, room_description) VALUES
(11, 'R101', 2, 4500.00, 'unisex', 1, 'Spacious room with good ventilation'),
(11, 'R102', 3, 5000.00, 'unisex', 1, 'Corner room with balcony view'),
(11, 'R103', 2, 4800.00, 'unisex', 1, 'Near washroom, well maintained'),
(11, 'R104', 3, 5200.00, 'unisex', 1, 'Premium room with attached bathroom'),
(11, 'R105', 2, 4500.00, 'unisex', 1, 'Ground floor, easy access'),
(11, 'R201', 2, 4800.00, 'unisex', 1, 'First floor, peaceful'),
(11, 'R202', 3, 5000.00, 'unisex', 1, 'Corner room, good lighting'),
(11, 'R203', 2, 4700.00, 'unisex', 1, 'Standard room'),
(11, 'R204', 3, 5100.00, 'unisex', 1, 'Premium room with AC'),
(11, 'R205', 2, 4600.00, 'unisex', 1, 'Well ventilated');

-- =====================================
-- 6) BEDS (Create beds for all rooms)
-- =====================================
-- For rooms with 2 beds
INSERT INTO beds (room_id, bed_number, status)
SELECT id, 1, 'vacant' FROM rooms WHERE total_beds = 2
UNION ALL
SELECT id, 2, 'vacant' FROM rooms WHERE total_beds = 2;

-- For rooms with 3 beds
INSERT INTO beds (room_id, bed_number, status)
SELECT id, 1, 'vacant' FROM rooms WHERE total_beds = 3
UNION ALL
SELECT id, 2, 'vacant' FROM rooms WHERE total_beds = 3
UNION ALL
SELECT id, 3, 'vacant' FROM rooms WHERE total_beds = 3;

-- =====================================
-- 7) PG FACILITIES
-- =====================================
INSERT INTO pg_facilities (pg_id, facility_type, label) VALUES
(1, 'FOOD', 'Veg & Non-Veg Mess'),
(1, 'WIFI', 'High Speed WiFi'),
(1, 'AC', 'AC Rooms Available'),
(1, 'CCTV', '24x7 CCTV'),
(2, 'FOOD', 'Food Available'),
(2, 'WIFI', 'WiFi'),
(2, 'AC', 'AC Rooms'),
(3, 'FOOD', 'Food'),
(3, 'PARKING', 'Two-wheeler Parking'),
(3, 'SECURITY', 'Guard'),
(4, 'FOOD', 'Food'),
(4, 'WIFI', 'WiFi'),
(4, 'STUDY_ROOM', 'Study Room'),
(5, 'FOOD', 'Food'),
(5, 'LAUNDRY', 'Laundry'),
(5, 'CCTV', 'CCTV'),
(6, 'FOOD', 'Food'),
(6, 'WIFI', 'WiFi'),
(6, 'AC', 'AC Rooms'),
(7, 'FOOD', 'Food'),
(7, 'PARKING', 'Parking'),
(7, 'SECURITY', 'Security'),
(8, 'FOOD', 'Food'),
(8, 'WIFI', 'WiFi'),
(8, 'GYM', 'Gym'),
(9, 'FOOD', 'Food'),
(9, 'CCTV', 'CCTV'),
(9, 'STUDY_ROOM', 'Study Room'),
(10, 'FOOD', 'Food'),
(10, 'WIFI', 'WiFi'),
(10, 'LAUNDRY', 'Laundry'),
(11, 'FOOD', 'Veg & Non-Veg Mess'),
(11, 'WIFI', 'High Speed WiFi'),
(11, 'AC', 'AC Rooms Available'),
(11, 'PARKING', 'Vehicle Parking'),
(11, 'LAUNDRY', 'Laundry Service'),
(11, 'SECURITY', '24/7 Security'),
(11, 'CCTV', 'CCTV Surveillance');

-- =====================================
-- 8) TENANT_USERS (Marketplace)
-- =====================================
INSERT INTO tenant_users (id, name, phone, email, gender, profession, budget_min, budget_max, preferred_city, preferred_area, password_hash) VALUES
(1, 'Rohit Kumar', '9100000001', 'tenantuser1@example.com', 'male', 'working', 6000, 9000, 'Delhi', 'Karol Bagh', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
(2, 'Priya Singh', '9100000002', 'tenantuser2@example.com', 'female', 'student', 5000, 8000, 'Delhi', 'Lajpat Nagar', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
(3, 'Aman Verma', '9100000003', 'tenantuser3@example.com', 'male', 'student', 7000, 10000, 'Mumbai', 'Andheri', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
(4, 'Neha Sharma', '9100000004', 'tenantuser4@example.com', 'female', 'working', 6000, 9500, 'Bangalore', 'Koramangala', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
(5, 'Karan Patel', '9100000005', 'tenantuser5@example.com', 'male', 'working', 6500, 10000, 'Noida', 'Sector 62', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');

-- =====================================
-- 9) PG_LEAD_METRICS (Sample data)
-- =====================================
INSERT INTO pg_lead_metrics (pg_id, metric_date, profile_views, total_inquiries, contacted_inquiries, booked_inquiries) VALUES
(1, CURDATE(), 25, 5, 3, 1),
(2, CURDATE(), 30, 6, 4, 2),
(3, CURDATE(), 40, 8, 5, 3),
(4, CURDATE(), 20, 4, 2, 1),
(5, CURDATE(), 35, 7, 4, 2),
(6, CURDATE(), 22, 3, 2, 1),
(7, CURDATE(), 28, 5, 3, 1),
(8, CURDATE(), 26, 4, 2, 1),
(9, CURDATE(), 32, 6, 4, 2),
(10, CURDATE(), 18, 3, 1, 1),
(11, CURDATE(), 10, 1, 0, 0)
ON DUPLICATE KEY UPDATE 
  profile_views=VALUES(profile_views),
  total_inquiries=VALUES(total_inquiries),
  contacted_inquiries=VALUES(contacted_inquiries),
  booked_inquiries=VALUES(booked_inquiries);

-- =====================================
-- END OF CLEAN SEED DATA
-- =====================================

