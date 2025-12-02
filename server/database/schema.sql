-- ===============================================
-- PG-PILOT FULL DATABASE SCHEMA (FINAL VERSION)
-- WITHOUT RAZORPAY RENT COLLECTION
-- WITH RAZORPAY FOR PG SUBSCRIPTION PURCHASE
-- ===============================================

SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS 
    audit_logs, referrals, coupons, invoices, pg_subscriptions,
    plans, bill_allocations, bills, mess_bills, tenant_mess,
    mess_plans, complaints, payments, tenants, beds,
    rooms, users, pgs;

SET FOREIGN_KEY_CHECKS=1;

-- =====================================
-- 1) PG TABLE
-- =====================================
CREATE TABLE pgs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pg_uid VARCHAR(20) UNIQUE,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    food_enabled BOOLEAN DEFAULT 0,
    default_due_day INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: pg_uid is generated in application code to avoid trigger conflicts

-- =====================================
-- 2) USERS TABLE (SUPERADMIN + PG ADMIN)
-- =====================================
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pg_id BIGINT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(15) UNIQUE,
    password_hash VARCHAR(255),
    role ENUM('superadmin','pg_admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pg_id) REFERENCES pgs(id) ON DELETE SET NULL
);

-- =====================================
-- 3) ROOMS TABLE
-- =====================================
CREATE TABLE rooms (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pg_id BIGINT NOT NULL,
    room_name VARCHAR(100) NOT NULL,
    total_beds INT NOT NULL,
    rent_per_bed DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pg_id) REFERENCES pgs(id) ON DELETE CASCADE
);

-- =====================================
-- 4) BEDS
-- =====================================
CREATE TABLE beds (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_id BIGINT NOT NULL,
    bed_number INT NOT NULL,
    status ENUM('vacant','occupied','blocked') DEFAULT 'vacant',
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- =====================================
-- 5) TENANTS
-- =====================================
CREATE TABLE tenants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pg_id BIGINT NOT NULL,
    bed_id BIGINT NULL,
    name VARCHAR(100),
    phone VARCHAR(15),
    email VARCHAR(150),
    aadhaar_url VARCHAR(255),
    join_date DATE,
    rent_amount DECIMAL(10,2),
    deposit_amount DECIMAL(10,2),
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pg_id) REFERENCES pgs(id) ON DELETE CASCADE,
    FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE SET NULL
);

-- =====================================
-- 6) PAYMENTS (MANUAL / QR / CASH)
-- =====================================
CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    pg_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    month_for DATE NOT NULL,
    mode ENUM('cash','qr','manual') NOT NULL,
    status ENUM('pending','received','failed') DEFAULT 'pending',
    transaction_id VARCHAR(255),
    receipt_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (pg_id) REFERENCES pgs(id) ON DELETE CASCADE
);

-- =====================================
-- 7) COMPLAINTS
-- =====================================
CREATE TABLE complaints (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    pg_id BIGINT NOT NULL,
    title VARCHAR(200),
    description TEXT,
    photo_url VARCHAR(255),
    status ENUM('open','in_progress','resolved') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (pg_id) REFERENCES pgs(id)
);

-- =====================================
-- 8) MESS PLANS
-- =====================================
CREATE TABLE mess_plans (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pg_id BIGINT NOT NULL,
    name VARCHAR(100),
    price DECIMAL(10,2),
    FOREIGN KEY (pg_id) REFERENCES pgs(id)
);

-- =====================================
-- 9) TENANT_MESS (ASSIGN MESS PLAN)
-- =====================================
CREATE TABLE tenant_mess (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    mess_plan_id BIGINT NOT NULL,
    start_date DATE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (mess_plan_id) REFERENCES mess_plans(id)
);

-- =====================================
-- 10) MESS BILLS
-- =====================================
CREATE TABLE mess_bills (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    pg_id BIGINT NOT NULL,
    month_for DATE NOT NULL,
    amount DECIMAL(10,2),
    status ENUM('pending','paid') DEFAULT 'pending',
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (pg_id) REFERENCES pgs(id)
);

-- =====================================
-- 11) BILLS (ELECTRICITY/WATER)
-- =====================================
CREATE TABLE bills (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pg_id BIGINT NOT NULL,
    bill_type ENUM('electricity','water') NOT NULL,
    amount DECIMAL(10,2),
    bill_month DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pg_id) REFERENCES pgs(id)
);

-- =====================================
-- 12) BILL ALLOCATION TO TENANTS
-- =====================================
CREATE TABLE bill_allocations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bill_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    amount DECIMAL(10,2),
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- =====================================
-- 13) SAAS PLANS (SUPER ADMIN)
-- =====================================
CREATE TABLE plans (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    price DECIMAL(10,2),
    duration_days INT,
    max_pgs INT DEFAULT 1,
    max_rooms INT DEFAULT 10,
    max_beds INT DEFAULT 50,
    description TEXT
);

-- =====================================
-- 14) PG SUBSCRIPTIONS
-- =====================================
CREATE TABLE pg_subscriptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pg_id BIGINT NOT NULL,
    plan_id BIGINT NOT NULL,
    start_date DATE,
    expiry_date DATE,
    custom_price DECIMAL(10,2),
    FOREIGN KEY (pg_id) REFERENCES pgs(id),
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- =====================================
-- 15) INVOICES (PG SUBSCRIPTION PAYMENTS)
-- =====================================
CREATE TABLE invoices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pg_id BIGINT NOT NULL,
    amount DECIMAL(10,2),
    status ENUM('unpaid','paid') DEFAULT 'unpaid',
    invoice_date DATE,
    due_date DATE,
    order_id VARCHAR(255),
    payment_id VARCHAR(255),
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    transaction_id VARCHAR(255),
    FOREIGN KEY (pg_id) REFERENCES pgs(id)
);

-- =====================================
-- 16) COUPONS
-- =====================================
CREATE TABLE coupons (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) UNIQUE,
    discount_percent INT,
    max_uses INT,
    expires_on DATE
);

-- =====================================
-- 17) REFERRALS (PG → PG REFERRAL SYSTEM)
-- =====================================
CREATE TABLE referrals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    referred_by BIGINT,
    referred_pg BIGINT,
    reward_days INT DEFAULT 7,
    status ENUM('pending','activated') DEFAULT 'pending',
    FOREIGN KEY (referred_by) REFERENCES pgs(id),
    FOREIGN KEY (referred_pg) REFERENCES pgs(id)
);

-- =====================================
-- 18) AUDIT LOGS
-- =====================================
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pg_id BIGINT,
    user_id BIGINT,
    action VARCHAR(255),
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pg_id) REFERENCES pgs(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===============================================
-- END OF THE COMPLETE SCHEMA
-- ===============================================

