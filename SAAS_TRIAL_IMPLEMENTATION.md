# SaaS Trial System Implementation

## Overview
This document describes the implementation of a **1-month FREE TRIAL** system similar to Zoho/Freshworks/Notion, integrated into the PG-Pilot application.

## Business Flow

```
Login / Signup (FREE)
↓
Register PG
↓
FREE TRIAL START (30 days from PG registration date)
↓
Full Dashboard Access during trial
↓
Trial Expired
↓
Read-only mode + Upgrade Required
↓
Payment
↓
Full Access Again
```

## Database Changes

### Migration File
**File**: `server/database/migrations/add_trial_fields.sql`

Added to `pgs` table:
- `trial_start_date` (DATE) - When trial started
- `trial_end_date` (DATE) - When trial expires (30 days from start)
- `subscription_status` (ENUM: 'TRIAL', 'ACTIVE', 'EXPIRED') - Current status

### Schema Updates
- Indexes added for performance: `idx_subscription_status`, `idx_trial_end_date`
- Existing PGs automatically get trial dates set based on `created_at`

## Backend Implementation

### 1. PG Registration - Auto Trial Start
**File**: `server/controller/pgController.js`

When a PG is registered:
- `trial_start_date` = today
- `trial_end_date` = today + 30 days
- `subscription_status` = 'TRIAL'

**Key Code**:
```javascript
const trialStartDate = new Date();
const trialEndDate = new Date();
trialEndDate.setDate(trialEndDate.getDate() + 30);

await database.query(
  `UPDATE pgs 
   SET pg_uid = ?, 
       trial_start_date = ?, 
       trial_end_date = ?, 
       subscription_status = 'TRIAL' 
   WHERE id = ?`,
  [pgUid, trialStartDate, trialEndDate, pgId]
);
```

### 2. Subscription Guard Middleware
**File**: `server/middleware/subscriptionGuard.js`

**Purpose**: Enforces access control based on subscription/trial status

**Access Levels**:
- `FULL_ACCESS`: Trial active OR paid subscription active
- `READ_ONLY`: Trial expired OR subscription expired
- `BLOCKED`: No PG or invalid state

**Rules**:
- TRIAL and within `trial_end_date` → FULL_ACCESS
- TRIAL expired → READ_ONLY
- ACTIVE and plan valid → FULL_ACCESS
- ACTIVE but plan expired → READ_ONLY

**Applied To**:
- POST routes (create operations)
- PUT routes (update operations)
- DELETE routes (delete operations)

**NOT Applied To**:
- GET routes (read operations - always allowed)

### 3. Subscription Controller Updates
**File**: `server/controller/subscriptionController.js`

**Updated**: `getActiveSubscription()` now returns:
```javascript
{
  subscription: { ...paid subscription... } | null,
  trial: {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    isActive: true,
    status: 'TRIAL'
  } | null,
  hasAccess: true | false
}
```

### 4. Payment Verification - Subscription Activation
**File**: `server/controller/subscriptionPaymentController.js`

When payment is verified:
- Creates subscription in `pg_subscriptions` table
- **Updates `subscription_status` from 'TRIAL' to 'ACTIVE'**
- Sets plan start/end dates

**Key Code**:
```javascript
// Activate subscription: Change subscription_status from TRIAL to ACTIVE
await database.query(
  `UPDATE pgs 
   SET subscription_status = 'ACTIVE' 
   WHERE id = ?`,
  [finalPgId]
);
```

### 5. Subscription Utils Updates
**File**: `server/utils/subscriptionUtils.js`

**Updated**: `getActiveSubscription()` now checks:
1. Active paid subscription first
2. If none, checks if trial is active
3. Returns trial object with default limits if trial is active

### 6. Routes Protected
**Files**: 
- `server/routes/roomRoutes.js`
- `server/routes/tenantRoutes.js`
- `server/routes/bedRoutes.js`
- `server/routes/pgRoutes.js` (update/delete only)

**Pattern**:
```javascript
// Read - no guard
router.get('/...', authenticateToken, controller.get);

// Write - requires guard
router.post('/', authenticateToken, subscriptionGuard, controller.create);
router.put('/:id', authenticateToken, subscriptionGuard, controller.update);
router.delete('/:id', authenticateToken, subscriptionGuard, controller.delete);
```

## Frontend Implementation

### 1. Subscription Context
**File**: `client/src/context/SubscriptionContext.jsx`

**Purpose**: Global state management for subscription/trial status

**Provides**:
- `subscriptionStatus` - Active paid subscription
- `trialInfo` - Trial details (start, end, isActive)
- `hasAccess` - Whether user has full access
- `isTrialActive` - Boolean
- `isTrialExpired` - Boolean
- `isReadOnly` - Boolean
- `daysRemaining` - Days left in trial/subscription
- `refreshSubscription()` - Manual refresh function

**Auto-refresh**: Every 5 minutes

### 2. Protected Route Updates
**File**: `client/src/protected/protected-route.jsx`

**Updated**: Now checks for `hasAccess` which includes:
- Active paid subscription OR
- Active trial

**Key Change**:
```javascript
subscriptionFound = subResponse.data.hasAccess === true || 
                   subResponse.data.subscription !== null || 
                   subResponse.data.trial?.isActive === true;
```

### 3. Trial Banner Component
**File**: `client/src/components/common/TrialBanner.jsx`

**Displays**:
- **Trial Active**: "🎉 Free Trial – X days remaining" with "Upgrade Now" button
- **Trial Expired**: "⛔ Trial expired. Upgrade to continue" with "Upgrade Now" button
- **Hidden**: When user has active paid subscription

**Location**: Top of all dashboard pages (via LayoutWrapper)

### 4. UI Button Disabling
**Files**: 
- `client/src/pages/RoomsBeds.jsx`
- `client/src/pages/Tenants.jsx`

**Changes**:
- "Add Room" / "Add Tenant" buttons disabled when `isReadOnly === true`
- Edit buttons disabled with tooltip
- Delete handlers check `isReadOnly` before executing

**Example**:
```javascript
const { isReadOnly } = useSubscription();

<Button 
  onClick={() => setIsModalOpen(true)} 
  disabled={isReadOnly}
  title={isReadOnly ? 'Trial expired. Please upgrade.' : ''}
>
  Add New Room
</Button>
```

### 5. App.jsx Integration
**File**: `client/src/App.jsx`

**Added**: `SubscriptionProvider` wrapper around entire app

```javascript
<SubscriptionProvider>
  <Router>
    <LayoutDecider />
  </Router>
</SubscriptionProvider>
```

## Testing Checklist

### Database
- [ ] Run migration: `server/database/migrations/add_trial_fields.sql`
- [ ] Verify existing PGs have trial dates set
- [ ] Verify new PGs get trial dates on creation

### Backend
- [ ] PG registration creates trial automatically
- [ ] Subscription guard blocks write operations when trial expired
- [ ] Subscription guard allows write operations during trial
- [ ] Payment verification activates subscription (TRIAL → ACTIVE)
- [ ] Active subscription check includes trial status

### Frontend
- [ ] Trial banner shows during trial
- [ ] Trial banner shows "expired" message after trial ends
- [ ] Buttons disabled when trial expired
- [ ] Dashboard accessible during trial
- [ ] Dashboard accessible with active subscription
- [ ] ProtectedRoute allows access during trial

## API Response Examples

### Get Active Subscription (with trial)
```json
{
  "subscription": null,
  "trial": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "isActive": true,
    "status": "TRIAL"
  },
  "hasAccess": true
}
```

### Get Active Subscription (paid)
```json
{
  "subscription": {
    "id": 1,
    "pg_id": 1,
    "plan_id": 2,
    "start_date": "2024-01-15",
    "expiry_date": "2024-02-15",
    "plan_name": "Standard Plan",
    "plan_price": 1999.00
  },
  "trial": null,
  "hasAccess": true
}
```

### Subscription Guard Response (403)
```json
{
  "error": "Access denied",
  "message": "Trial expired. Please upgrade to continue using this feature.",
  "accessLevel": "READ_ONLY",
  "requiresUpgrade": true
}
```

## Important Notes

1. **Trial starts ONLY on PG registration** - Not on login/signup
2. **Trial duration**: Fixed 30 days from PG creation
3. **Read-only mode**: Users can view data but cannot create/update/delete
4. **No data deletion**: Trial expiry does NOT delete any data
5. **Payment activation**: Changes status from TRIAL to ACTIVE immediately
6. **Superadmin bypass**: All checks bypassed for superadmin role

## Future Enhancements

- Email notifications for trial expiry (7 days, 3 days, 1 day before)
- Trial extension for specific users
- Custom trial durations per plan
- Trial usage analytics
- Grace period after trial expiry

## Files Modified/Created

### Backend
- ✅ `server/database/migrations/add_trial_fields.sql` (NEW)
- ✅ `server/controller/pgController.js` (MODIFIED)
- ✅ `server/middleware/subscriptionGuard.js` (NEW)
- ✅ `server/controller/subscriptionController.js` (MODIFIED)
- ✅ `server/controller/subscriptionPaymentController.js` (MODIFIED)
- ✅ `server/utils/subscriptionUtils.js` (MODIFIED)
- ✅ `server/routes/roomRoutes.js` (MODIFIED)
- ✅ `server/routes/tenantRoutes.js` (MODIFIED)
- ✅ `server/routes/bedRoutes.js` (MODIFIED)
- ✅ `server/routes/pgRoutes.js` (MODIFIED)

### Frontend
- ✅ `client/src/context/SubscriptionContext.jsx` (NEW)
- ✅ `client/src/components/common/TrialBanner.jsx` (NEW)
- ✅ `client/src/App.jsx` (MODIFIED)
- ✅ `client/src/protected/protected-route.jsx` (MODIFIED)
- ✅ `client/src/modules/layout/LayoutWrapper.jsx` (MODIFIED)
- ✅ `client/src/pages/RoomsBeds.jsx` (MODIFIED)
- ✅ `client/src/pages/Tenants.jsx` (MODIFIED)

## Summary

The SaaS trial system is now fully implemented:
- ✅ 30-day free trial starts automatically on PG registration
- ✅ Full access during trial
- ✅ Read-only mode after trial expiry
- ✅ Backend middleware enforces access control
- ✅ Frontend UI shows trial status and disables actions
- ✅ Payment activates subscription and restores full access
- ✅ Existing system remains intact (no breaking changes)

