# Subscription & Razorpay Payment Integration Setup

## Overview
Complete subscription system with Razorpay payment integration has been implemented. Super Admin can create plans, and PG Admins can subscribe to plans via Razorpay payment.

## Database Migration Required

Run the following SQL migration to add plan limits to the plans table:

```sql
-- Run this in your MySQL database
ALTER TABLE plans 
ADD COLUMN max_pgs INT DEFAULT 1,
ADD COLUMN max_rooms INT DEFAULT 10,
ADD COLUMN max_beds INT DEFAULT 50,
ADD COLUMN description TEXT;
```

Or run the migration file:
```bash
mysql -u your_username -p your_database < server/database/migrations/add_plan_limits.sql
```

## Features Implemented

### 1. Plan Management (Super Admin)
- Create/Edit/Delete plans with limits (max_pgs, max_rooms, max_beds)
- Plans page updated with all fields

### 2. Landing Page
- Fetches plans from database
- Shows plan details with limits
- "Subscribe Now" button triggers payment flow

### 3. Subscription Flow
- User clicks "Subscribe Now" on landing page
- If not logged in → Redirects to login
- After login → Redirects back to landing page
- If logged in as PG Admin → Proceeds to Razorpay payment
- Payment verification creates subscription automatically

### 4. Razorpay Integration
- Payment controller: `server/controller/subscriptionPaymentController.js`
- Routes: `server/routes/subscriptionPaymentRoutes.js`
- Razorpay keys configured (test mode):
  - Key ID: `rzp_test_Rmoh4WhxaIg16m`
  - Key Secret: `xH15K2IZJvoNp4taKXGhdUDD`

### 5. Plan-Based Restrictions
- Room creation checks subscription limits
- Bed creation checks subscription limits
- Error messages shown when limits exceeded

## API Endpoints

### Public
- `GET /api/plans/public` - Get all plans for landing page
- `GET /api/subscription-payment/razorpay-key` - Get Razorpay key

### Protected (Requires Authentication)
- `POST /api/subscription-payment/create-order` - Create Razorpay order
- `POST /api/subscription-payment/verify` - Verify payment and create subscription

## How It Works

1. **Super Admin creates plans** with limits via `/plans` page
2. **Plans displayed on landing page** from database
3. **PG Admin clicks "Subscribe Now"**:
   - If not logged in → Login page → Back to landing page
   - If logged in → Razorpay payment popup
4. **After successful payment**:
   - Payment verified
   - Subscription created in `pg_subscriptions` table
   - Invoice created in `invoices` table
   - User redirected to dashboard
5. **When creating rooms/beds**:
   - System checks active subscription
   - Validates against plan limits
   - Shows error if limit exceeded

## Files Modified/Created

### Backend
- `server/controller/planController.js` - Added public endpoint and plan limits
- `server/controller/subscriptionPaymentController.js` - NEW: Razorpay payment handling
- `server/controller/paymentController.js` - Restored tenant payment functions
- `server/controller/roomController.js` - Added subscription limit checks
- `server/routes/planRoutes.js` - Added public route
- `server/routes/subscriptionPaymentRoutes.js` - NEW: Payment routes
- `server/routes/routes.js` - Added subscription payment routes
- `server/utils/subscriptionUtils.js` - NEW: Subscription limit checking utilities
- `server/database/migrations/add_plan_limits.sql` - NEW: Migration file

### Frontend
- `client/src/pages/Plans.jsx` - Added plan limits fields
- `client/src/pages/LandingPage.jsx` - Fetch from API, payment integration
- `client/src/modules/auth/login.jsx` - Handle planId redirect

## Testing

1. Run database migration
2. Login as Super Admin
3. Create a plan with limits
4. Logout and go to landing page
5. Click "Subscribe Now" on a plan
6. Login as PG Admin
7. Complete Razorpay payment (use test card: 4111 1111 1111 1111)
8. Try creating rooms/beds - should respect plan limits

## Notes

- Razorpay is in test mode - use test cards for payments
- Subscription expiry is calculated based on `duration_days` in plan
- Plan limits are enforced when creating rooms and beds
- Active subscription is checked before allowing resource creation

