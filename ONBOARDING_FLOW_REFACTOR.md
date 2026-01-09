# PG Admin Onboarding Flow Refactor - Summary

## ✅ COMPLETED CHANGES

### 1. New Pages Created
- **`/register-pg`** - RegisterPG.jsx: Dedicated page for PG registration (FREE, no payment required)
- **`/pg-success`** - PGSuccess.jsx: Success page after PG registration with CTA to choose plan
- **`/choose-plan`** - ChoosePlan.jsx: Plan selection page (accessible only after PG registration)
- **`/payment-success`** - PaymentSuccess.jsx: Payment success page that redirects to dashboard

### 2. Updated ProtectedRoute Component
- Added `requirePG` and `requirePlan` props for granular access control
- Added onboarding state checks:
  - `hasPG`: Checks if user has registered a PG
  - `hasSubscription`: Checks if user has active subscription
- Smart redirects based on user state:
  - No PG → `/register-pg`
  - Has PG, no plan → `/choose-plan`
  - Has PG, has plan → Allow access

### 3. Updated Routes (app-routes.jsx)
- Added onboarding routes with proper guards
- Updated all dashboard routes to require both PG and plan
- Updated App.jsx to exclude onboarding pages from dashboard layout

### 4. Updated Signup Flow (LandingPage.jsx)
- **REMOVED**: Automatic PG creation during signup
- **NEW**: Signup only creates user account, then redirects to `/register-pg`
- Flow: Signup → Register PG → PG Success → Choose Plan → Payment → Dashboard

### 5. Updated Login Flow (LandingPage.jsx)
- **NEW**: Post-login redirects based on user state:
  - No PG → `/register-pg`
  - Has PG, no plan → `/choose-plan`
  - Has PG, has plan → `/dashboard`

### 6. Updated PG Creation Flow
- **REMOVED**: Payment initiation from PG creation modal
- **NEW**: PG creation redirects to `/pg-success` page
- PG registration is now FREE and separate from payment

### 7. Updated Payment Flow
- Payment success redirects to `/payment-success` page
- Payment success page prevents back navigation
- After payment success, redirects to `/dashboard`

## 📋 FLOW DIAGRAM

```
Landing Page (/for-owners)
    ↓
Sign Up / Login
    ↓
Register PG (/register-pg) [FREE]
    ↓
PG Registered Success (/pg-success)
    ↓
Choose Plan (/choose-plan)
    ↓
Payment (Razorpay)
    ↓
Payment Success (/payment-success)
    ↓
Dashboard (/dashboard)
```

## 🔒 ACCESS CONTROL RULES

### Route Guards
- **`/register-pg`**: Requires login, no PG required
- **`/pg-success`**: Requires login + PG, no plan required
- **`/choose-plan`**: Requires login + PG, no plan required
- **`/payment-success`**: Requires login + PG, no plan required
- **`/dashboard`**: Requires login + PG + active plan
- **All other dashboard routes**: Require login + PG + active plan

### State Flags (Reused from existing DB)
- `isLoggedIn`: Checked via `/api/auth/me`
- `isPGRegistered`: Checked via `user.pg_id` from `/api/auth/me`
- `isPlanActive`: Checked via `/api/subscriptions/pg/{pg_id}/active`

## 🗄️ DATABASE CHANGES
**NONE REQUIRED** - All state flags already exist:
- `users.pg_id` - indicates PG registration
- `pg_subscriptions` table - tracks active subscriptions
- Existing API endpoints already support these checks

## 🔧 BACKEND MIDDLEWARE SUGGESTIONS

### Recommended Middleware (server/middleware/validateSubscription.js)
```javascript
const validateActiveSubscription = async (req, res, next) => {
  const { role, pg_id } = req.user;
  
  // Superadmin bypass
  if (role === 'superadmin') return next();
  
  // Public routes bypass
  const publicRoutes = ['/api/pgs', '/api/plans/public'];
  if (publicRoutes.some(route => req.path.startsWith(route))) return next();
  
  // Check PG exists
  if (!pg_id) {
    return res.status(403).json({ 
      error: 'PG not registered. Please register your PG first.' 
    });
  }
  
  // Check active subscription
  try {
    const [subscriptions] = await database.query(
      `SELECT * FROM pg_subscriptions 
       WHERE pg_id = ? AND expiry_date >= CURDATE() 
       ORDER BY expiry_date DESC LIMIT 1`,
      [pg_id]
    );
    
    if (subscriptions.length === 0) {
      return res.status(403).json({ 
        error: 'No active subscription. Please subscribe to a plan.' 
      });
    }
    
    req.activeSubscription = subscriptions[0];
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking subscription' });
  }
};
```

### Apply to Dashboard Routes
```javascript
// In server/routes/index.js or similar
router.use('/api/tenants', validateActiveSubscription);
router.use('/api/rooms', validateActiveSubscription);
router.use('/api/payments', validateActiveSubscription);
// ... other dashboard routes
```

## ✅ VERIFICATION CHECKLIST

- [x] Signup creates account only (no PG)
- [x] Signup redirects to `/register-pg`
- [x] PG registration is free
- [x] PG registration redirects to `/pg-success`
- [x] PG success page shows "Choose Plan" CTA
- [x] Plan selection requires PG
- [x] Payment success redirects to success page
- [x] Payment success prevents back navigation
- [x] Dashboard requires PG + active plan
- [x] Login redirects based on state
- [x] All routes properly guarded

## 🎯 EXISTING FEATURES PRESERVED

✅ All existing APIs remain unchanged
✅ All existing database tables remain unchanged
✅ All existing components reused
✅ Superadmin flow unchanged
✅ Tenant marketplace flow unchanged
✅ Only routing and flow logic changed

## 📝 NOTES

- PG registration is now a separate, free step
- Users cannot access dashboard without completing onboarding
- Payment is required only after PG registration
- All redirects use `replace: true` to prevent back navigation issues
- Onboarding pages don't show dashboard layout (sidebar/navbar)

