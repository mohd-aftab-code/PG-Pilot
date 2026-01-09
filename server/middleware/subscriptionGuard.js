const database = require('../config/database');

/**
 * Subscription Guard Middleware
 * 
 * Enforces SaaS-style subscription/trial access control:
 * - TRIAL and within trial_end_date → FULL_ACCESS
 * - TRIAL expired → READ_ONLY
 * - ACTIVE and plan valid → FULL_ACCESS
 * - ACTIVE but plan expired → READ_ONLY
 * 
 * Usage:
 * - Apply to POST, PUT, DELETE routes (create/update/delete operations)
 * - GET routes (read operations) should NOT use this middleware
 */
const subscriptionGuard = async (req, res, next) => {
  try {
    const { role, pg_id: userPgId } = req.user;

    // Superadmin bypasses all checks
    if (role === 'superadmin') {
      return next();
    }

    // If no PG ID, deny access (shouldn't happen if auth is correct)
    if (!userPgId) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'No PG associated with your account. Please register a PG first.',
        accessLevel: 'BLOCKED'
      });
    }

    // Get PG with subscription status
    const [pgs] = await database.query(
      `SELECT id, trial_start_date, trial_end_date, subscription_status 
       FROM pgs 
       WHERE id = ?`,
      [userPgId]
    );

    if (pgs.length === 0) {
      return res.status(404).json({ 
        error: 'PG not found',
        accessLevel: 'BLOCKED'
      });
    }

    const pg = pgs[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const todayStr = today.toISOString().split('T')[0];
    const subscriptionStatus = pg.subscription_status;

    // Check if trial is active - use proper date comparison
    let isTrialActive = false;
    if (subscriptionStatus === 'TRIAL' && pg.trial_end_date) {
      try {
        // Convert trial_end_date to Date object for proper comparison
        const trialEndDate = new Date(pg.trial_end_date + 'T00:00:00');
        trialEndDate.setHours(0, 0, 0, 0);
        isTrialActive = trialEndDate >= today;
        
        // Fallback: string comparison if date comparison fails
        if (!isTrialActive && typeof pg.trial_end_date === 'string') {
          const trialEndStr = pg.trial_end_date.split('T')[0];
          isTrialActive = trialEndStr >= todayStr;
        }
      } catch (dateError) {
        // Fallback to string comparison
        if (typeof pg.trial_end_date === 'string') {
          const trialEndStr = pg.trial_end_date.split('T')[0];
          isTrialActive = trialEndStr >= todayStr;
        }
      }
    }

    // Check if there's an active paid subscription
    const [activeSubscriptions] = await database.query(
      `SELECT * FROM pg_subscriptions 
       WHERE pg_id = ? AND expiry_date >= CURDATE() 
       ORDER BY expiry_date DESC 
       LIMIT 1`,
      [userPgId]
    );

    const hasActiveSubscription = activeSubscriptions.length > 0;

    // Determine access level
    let accessLevel = 'BLOCKED';
    let message = '';

    if (isTrialActive) {
      // Trial is active - FULL ACCESS
      accessLevel = 'FULL_ACCESS';
      const trialEndDate = new Date(pg.trial_end_date);
      const daysRemaining = Math.ceil((trialEndDate - new Date()) / (1000 * 60 * 60 * 24));
      message = `Trial active - ${daysRemaining} days remaining`;
    } else if (hasActiveSubscription) {
      // Active paid subscription - FULL ACCESS
      accessLevel = 'FULL_ACCESS';
      const sub = activeSubscriptions[0];
      const expiryDate = new Date(sub.expiry_date);
      const daysRemaining = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      message = `Active subscription - ${daysRemaining} days remaining`;
    } else if (subscriptionStatus === 'TRIAL' && pg.trial_end_date) {
      // Check if trial is expired using proper date comparison
      let isTrialExpired = false;
      try {
        const trialEndDate = new Date(pg.trial_end_date + 'T00:00:00');
        trialEndDate.setHours(0, 0, 0, 0);
        isTrialExpired = trialEndDate < today;
        
        // Fallback: string comparison
        if (!isTrialExpired && typeof pg.trial_end_date === 'string') {
          const trialEndStr = pg.trial_end_date.split('T')[0];
          isTrialExpired = trialEndStr < todayStr;
        }
      } catch (dateError) {
        // Fallback to string comparison
        if (typeof pg.trial_end_date === 'string') {
          const trialEndStr = pg.trial_end_date.split('T')[0];
          isTrialExpired = trialEndStr < todayStr;
        }
      }
      
      if (isTrialExpired) {
        // Trial expired - READ ONLY
        accessLevel = 'READ_ONLY';
        message = 'Trial expired. Please upgrade to continue using this feature.';
      } else {
        // No trial, no subscription - READ ONLY
        accessLevel = 'READ_ONLY';
        message = 'No active subscription. Please subscribe to a plan to use this feature.';
      }
    } else if (subscriptionStatus === 'ACTIVE' && !hasActiveSubscription) {
      // Subscription expired - READ ONLY
      accessLevel = 'READ_ONLY';
      message = 'Subscription expired. Please renew your plan to continue using this feature.';
    } else {
      // No trial, no subscription - READ ONLY
      accessLevel = 'READ_ONLY';
      message = 'No active subscription. Please subscribe to a plan to use this feature.';
    }

    // Attach access info to request for use in controllers
    req.subscriptionAccess = {
      level: accessLevel,
      message,
      isTrialActive,
      hasActiveSubscription,
      trialEndDate: pg.trial_end_date,
      subscriptionStatus
    };

    // If READ_ONLY or BLOCKED, deny write operations
    if (accessLevel === 'READ_ONLY' || accessLevel === 'BLOCKED') {
      return res.status(403).json({
        error: 'Access denied',
        message: message,
        accessLevel: accessLevel,
        requiresUpgrade: true
      });
    }

    // FULL_ACCESS - allow the request
    next();
  } catch (error) {
    console.error('Subscription guard error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to verify subscription status'
    });
  }
};

module.exports = subscriptionGuard;

