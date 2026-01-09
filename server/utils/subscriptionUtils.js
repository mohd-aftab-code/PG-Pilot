const database = require('../config/database');

// Get active subscription for a PG (includes trial check)
const getActiveSubscription = async (pgId) => {
  try {
    // First check for active paid subscription
    const [subscriptions] = await database.query(
      `SELECT ps.*, p.max_pgs, p.max_rooms, p.max_beds 
       FROM pg_subscriptions ps 
       JOIN plans p ON ps.plan_id = p.id 
       WHERE ps.pg_id = ? 
       AND ps.expiry_date >= CURDATE() 
       ORDER BY ps.start_date DESC 
       LIMIT 1`,
      [pgId]
    );

    if (subscriptions.length > 0) {
      return subscriptions[0];
    }

    // If no paid subscription, check if trial is active
    const [pgs] = await database.query(
      `SELECT trial_start_date, trial_end_date, subscription_status 
       FROM pgs 
       WHERE id = ?`,
      [pgId]
    );

    if (pgs.length > 0) {
      const pg = pgs[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day
      const todayStr = today.toISOString().split('T')[0];
      
      // Check if trial is active - use proper date comparison
      let isTrialActive = false;
      if (pg.subscription_status === 'TRIAL' && pg.trial_end_date) {
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
      
      if (isTrialActive) {
        // Return a trial subscription object with default limits
        return {
          id: null,
          pg_id: pgId,
          plan_id: null,
          start_date: pg.trial_start_date,
          expiry_date: pg.trial_end_date,
          is_trial: true,
          max_pgs: 1,
          max_rooms: 10, // Default trial limits
          max_beds: 50
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Get active subscription error:', error);
    return null;
  }
};

// Check if PG can create more PGs (for future use)
const canCreatePG = async (userId) => {
  // This would check if user has reached max_pgs limit
  // For now, we'll return true as each user typically has one PG
  return true;
};

// Check if PG can create more rooms
const canCreateRoom = async (pgId) => {
  try {
    const subscription = await getActiveSubscription(pgId);
    
    if (!subscription) {
      return { allowed: false, message: 'No active subscription found. Please subscribe to a plan.' };
    }

    // Get current room count
    const [rooms] = await database.query(
      'SELECT COUNT(*) as count FROM rooms WHERE pg_id = ?',
      [pgId]
    );

    const currentCount = rooms[0].count;
    const maxAllowed = subscription.max_rooms || 10;

    if (currentCount >= maxAllowed) {
      return { 
        allowed: false, 
        message: `You have reached the maximum limit of ${maxAllowed} rooms for your plan. Please upgrade your subscription.` 
      };
    }

    return { allowed: true, remaining: maxAllowed - currentCount };
  } catch (error) {
    console.error('Can create room check error:', error);
    return { allowed: false, message: 'Error checking subscription limits' };
  }
};

// Check if PG can create more beds
const canCreateBed = async (pgId, roomId) => {
  try {
    const subscription = await getActiveSubscription(pgId);
    
    if (!subscription) {
      return { allowed: false, message: 'No active subscription found. Please subscribe to a plan.' };
    }

    // Get current bed count for this PG
    const [beds] = await database.query(
      `SELECT COUNT(*) as count 
       FROM beds b 
       JOIN rooms r ON b.room_id = r.id 
       WHERE r.pg_id = ?`,
      [pgId]
    );

    const currentCount = beds[0].count;
    const maxAllowed = subscription.max_beds || 50;

    if (currentCount >= maxAllowed) {
      return { 
        allowed: false, 
        message: `You have reached the maximum limit of ${maxAllowed} beds for your plan. Please upgrade your subscription.` 
      };
    }

    return { allowed: true, remaining: maxAllowed - currentCount };
  } catch (error) {
    console.error('Can create bed check error:', error);
    return { allowed: false, message: 'Error checking subscription limits' };
  }
};

module.exports = {
  getActiveSubscription,
  canCreatePG,
  canCreateRoom,
  canCreateBed,
};

