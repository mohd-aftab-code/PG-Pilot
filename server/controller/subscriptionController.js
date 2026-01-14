const database = require('../config/database');

// Get all subscriptions for a PG
const getSubscriptions = async (req, res) => {
  try {
    const { pg_id } = req.params;
    const { role, pg_id: userPgIdFromToken, id: userId } = req.user;

    // Always check database for latest pg_id (token might be stale)
    if (role === 'pg_admin') {
      const [users] = await database.query('SELECT pg_id FROM users WHERE id = ?', [userId]);
      const userPgIdFromDB = users.length > 0 ? users[0].pg_id : null;
      const actualPgId = userPgIdFromDB || userPgIdFromToken;

      if (actualPgId && actualPgId != pg_id) {
        console.log(`SubscriptionController: Access denied - User ${userId} owns PG ${actualPgId}, not ${pg_id}`);
        return res.status(403).json({ error: 'Access denied' });
      }

      // If no pg_id in DB or token, but user is trying to access a PG, deny
      if (!actualPgId && pg_id) {
        console.log(`SubscriptionController: Access denied - User ${userId} has no PG assigned`);
        return res.status(403).json({ error: 'Access denied. Please register a PG first.' });
      }

      console.log(`SubscriptionController: Access granted - User ${userId} owns PG ${pg_id}`);
    }

    const [subscriptions] = await database.query(
      `SELECT ps.*, p.name as plan_name, p.price as plan_price, p.duration_days 
       FROM pg_subscriptions ps 
       JOIN plans p ON ps.plan_id = p.id 
       WHERE ps.pg_id = ? 
       ORDER BY ps.start_date DESC, ps.created_at DESC`,
      [pg_id]
    );

    console.log(`SubscriptionController: Found ${subscriptions.length} subscriptions for PG ${pg_id}`);
    res.json({ subscriptions });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current active subscription (includes trial status)
const getActiveSubscription = async (req, res) => {
  try {
    const { pg_id } = req.params;
    const { role, id: userId, pg_id: userPgIdFromToken } = req.user;

    // For pg_admin, verify they own this PG by checking database (token might be stale after PG registration)
    if (role === 'pg_admin') {
      console.log(`SubscriptionController: Checking PG ownership for user ${userId}, PG ${pg_id}`, {
        userPgIdFromToken,
        requestedPgId: pg_id
      });
      
      // Always check database for latest pg_id (token might be stale)
      const [users] = await database.query('SELECT pg_id FROM users WHERE id = ?', [userId]);
      const userPgIdFromDB = users.length > 0 ? users[0].pg_id : null;
      
      console.log(`SubscriptionController: User ${userId} pg_id from DB: ${userPgIdFromDB}, from token: ${userPgIdFromToken}`);
      
      // Use DB value if available, otherwise use token value
      const actualPgId = userPgIdFromDB || userPgIdFromToken;
      
      if (actualPgId && actualPgId != pg_id) {
        console.log(`SubscriptionController: Access denied - User ${userId} owns PG ${actualPgId}, not ${pg_id}`);
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // If no pg_id in DB or token, but user is trying to access a PG, deny (should register PG first)
      if (!actualPgId && pg_id) {
        console.log(`SubscriptionController: Access denied - User ${userId} has no PG assigned`);
        return res.status(403).json({ error: 'Access denied. Please register a PG first.' });
      }
      
      console.log(`SubscriptionController: Access granted - User ${userId} owns PG ${pg_id}`);
    }

    // Get PG trial info
    // Also check if trial is active directly in SQL for reliability
    // Use explicit date comparison with DATE() function to ensure proper comparison
    const [pgs] = await database.query(
      `SELECT 
         trial_start_date, 
         trial_end_date, 
         subscription_status,
         CASE 
           WHEN subscription_status = 'TRIAL' 
                AND trial_end_date IS NOT NULL 
                AND DATE(trial_end_date) >= CURDATE() 
           THEN 1
           ELSE 0
         END as is_trial_active_sql,
         CURDATE() as current_date_sql,
         DATE(trial_end_date) as trial_end_date_normalized
       FROM pgs 
       WHERE id = ?`,
      [pg_id]
    );

    const pg = pgs.length > 0 ? pgs[0] : null;
    
    // Log raw SQL result
    console.log(`SubscriptionController: Raw SQL result for PG ${pg_id}:`, {
      pg: pg ? {
        subscription_status: pg.subscription_status,
        trial_start_date: pg.trial_start_date,
        trial_end_date: pg.trial_end_date,
        trial_end_date_normalized: pg.trial_end_date_normalized,
        current_date_sql: pg.current_date_sql,
        is_trial_active_sql: pg.is_trial_active_sql,
        is_trial_active_sql_type: typeof pg.is_trial_active_sql,
        is_trial_active_sql_value: pg.is_trial_active_sql,
        sql_comparison: pg.trial_end_date_normalized && pg.current_date_sql 
          ? `${pg.trial_end_date_normalized} >= ${pg.current_date_sql} = ${pg.trial_end_date_normalized >= pg.current_date_sql}`
          : 'N/A'
      } : null
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const todayStr = today.toISOString().split('T')[0];

    // Check for active paid subscription
    const [subscriptions] = await database.query(
      `SELECT ps.*, p.name as plan_name, p.price as plan_price, p.duration_days 
       FROM pg_subscriptions ps 
       JOIN plans p ON ps.plan_id = p.id 
       WHERE ps.pg_id = ? AND ps.expiry_date >= CURDATE() 
       ORDER BY ps.expiry_date DESC 
       LIMIT 1`,
      [pg_id]
    );

    const paidSubscription = subscriptions.length > 0 ? subscriptions[0] : null;

    // Also get the most recent expired subscription (if any) for display purposes
    const [expiredSubscriptions] = await database.query(
      `SELECT ps.*, p.name as plan_name, p.price as plan_price, p.duration_days 
       FROM pg_subscriptions ps 
       JOIN plans p ON ps.plan_id = p.id 
       WHERE ps.pg_id = ? AND ps.expiry_date < CURDATE() 
       ORDER BY ps.expiry_date DESC 
       LIMIT 1`,
      [pg_id]
    );

    const expiredSubscription = expiredSubscriptions.length > 0 ? expiredSubscriptions[0] : null;

    // Determine if trial is active - use proper date comparison
    // First check SQL result, then verify with JavaScript
    let isTrialActive = false;
    
    // Use SQL result if available (most reliable)
    // MySQL might return 1 as number or string '1', handle both
    const sqlTrialActive = pg && (
      pg.is_trial_active_sql === 1 || 
      pg.is_trial_active_sql === '1' || 
      pg.is_trial_active_sql === true ||
      Number(pg.is_trial_active_sql) === 1
    );
    
    if (sqlTrialActive) {
      isTrialActive = true;
      console.log(`SubscriptionController: Trial active confirmed by SQL check for PG ${pg_id}`, {
        is_trial_active_sql: pg.is_trial_active_sql,
        type: typeof pg.is_trial_active_sql
      });
    } else if (pg && pg.subscription_status === 'TRIAL' && pg.trial_end_date) {
      try {
        // MySQL DATE returns as string 'YYYY-MM-DD' or Date object
        // Handle both cases
        let trialEndDateStr = pg.trial_end_date;
        if (trialEndDateStr instanceof Date) {
          trialEndDateStr = trialEndDateStr.toISOString().split('T')[0];
        } else if (typeof trialEndDateStr === 'string') {
          // Remove time part if present
          trialEndDateStr = trialEndDateStr.split('T')[0].split(' ')[0]; // Handle both 'YYYY-MM-DD' and 'YYYY-MM-DD HH:MM:SS'
        }
        
        // CRITICAL: Use string comparison (YYYY-MM-DD format compares correctly as strings)
        // '2026-02-08' >= '2026-01-09' = true (correct)
        isTrialActive = trialEndDateStr >= todayStr;
        
        console.log(`SubscriptionController: Trial date comparison for PG ${pg_id}:`, {
          trial_end_date_raw: pg.trial_end_date,
          trial_end_date_str: trialEndDateStr,
          today: todayStr,
          isTrialActive,
          subscription_status: pg.subscription_status,
          comparison: `"${trialEndDateStr}" >= "${todayStr}" = ${isTrialActive}`,
          trialEndDateType: typeof pg.trial_end_date,
          todayType: typeof todayStr
        });
        
        // If still false, try Date object comparison as fallback
        if (!isTrialActive) {
          try {
            const trialEndDate = new Date(trialEndDateStr + 'T00:00:00');
            trialEndDate.setHours(0, 0, 0, 0);
            const dateComparison = trialEndDate >= today;
            console.log(`SubscriptionController: Date object comparison fallback: ${dateComparison}`);
            if (dateComparison) {
              isTrialActive = true;
              console.log(`SubscriptionController: Overriding with Date comparison result: true`);
            }
          } catch (e) {
            console.error(`SubscriptionController: Date object comparison error:`, e);
          }
        }
      } catch (dateError) {
        console.error(`SubscriptionController: Error comparing trial dates for PG ${pg_id}:`, dateError);
        // Fallback to string comparison
        if (typeof pg.trial_end_date === 'string') {
          const trialEndStr = pg.trial_end_date.split('T')[0].split(' ')[0];
          isTrialActive = trialEndStr >= todayStr;
          console.log(`SubscriptionController: Using string comparison fallback: "${trialEndStr}" >= "${todayStr}" = ${isTrialActive}`);
        }
      }
    } else {
      console.log(`SubscriptionController: Trial check failed for PG ${pg_id}:`, {
        hasPg: !!pg,
        subscription_status: pg?.subscription_status,
        hasTrialEndDate: !!pg?.trial_end_date,
        trial_end_date_value: pg?.trial_end_date,
        trial_end_date_type: typeof pg?.trial_end_date
      });
    }

    const hasAccess = paidSubscription !== null || isTrialActive;

    // Log for debugging
    console.log(`SubscriptionController: PG ${pg_id} - hasAccess: ${hasAccess}`, {
      pg: pg ? {
        subscription_status: pg.subscription_status,
        trial_start_date: pg.trial_start_date,
        trial_end_date: pg.trial_end_date,
        today: todayStr
      } : null,
      isTrialActive,
      paidSubscription: paidSubscription ? { id: paidSubscription.id, expiry_date: paidSubscription.expiry_date } : null,
      hasAccess
    });

    // Return subscription info with trial status
    const responseData = { 
      subscription: paidSubscription,
      expiredSubscription: expiredSubscription, // Include expired subscription for display
      trial: pg ? {
        startDate: pg.trial_start_date,
        endDate: pg.trial_end_date,
        isActive: isTrialActive,
        status: pg.subscription_status
      } : null,
      hasAccess: hasAccess
    };
    
    // Final verification log
    console.log(`SubscriptionController: Final response for PG ${pg_id}:`, {
      hasAccess: responseData.hasAccess,
      isTrialActive,
      paidSubscriptionExists: !!paidSubscription,
      trialData: responseData.trial
    });
    
    res.json(responseData);
  } catch (error) {
    console.error('Get active subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create subscription
const createSubscription = async (req, res) => {
  try {
    const { pg_id, plan_id, start_date, custom_price } = req.body;
    const { role, pg_id: userPgId } = req.user;

    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!pg_id || !plan_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get plan details
    const [plans] = await database.query('SELECT * FROM plans WHERE id = ?', [plan_id]);
    if (plans.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const plan = plans[0];
    const startDate = start_date || new Date().toISOString().split('T')[0];
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + plan.duration_days);

    const [result] = await database.query(
      'INSERT INTO pg_subscriptions (pg_id, plan_id, start_date, expiry_date, custom_price) VALUES (?, ?, ?, ?, ?)',
      [pg_id, plan_id, startDate, expiryDate.toISOString().split('T')[0], custom_price || null]
    );

    const [subscriptions] = await database.query(
      `SELECT ps.*, p.name as plan_name, p.price as plan_price 
       FROM pg_subscriptions ps 
       JOIN plans p ON ps.plan_id = p.id 
       WHERE ps.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: 'Subscription created successfully', subscription: subscriptions[0] });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update subscription
const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan_id, start_date, expiry_date, custom_price } = req.body;
    const { role, pg_id } = req.user;

    const [subscriptions] = await database.query('SELECT * FROM pg_subscriptions WHERE id = ?', [id]);
    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (role === 'pg_admin' && pg_id != subscriptions[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await database.query(
      'UPDATE pg_subscriptions SET plan_id = ?, start_date = ?, expiry_date = ?, custom_price = ? WHERE id = ?',
      [plan_id, start_date, expiry_date, custom_price, id]
    );

    const [updatedSubscriptions] = await database.query(
      `SELECT ps.*, p.name as plan_name, p.price as plan_price 
       FROM pg_subscriptions ps 
       JOIN plans p ON ps.plan_id = p.id 
       WHERE ps.id = ?`,
      [id]
    );

    res.json({ message: 'Subscription updated successfully', subscription: updatedSubscriptions[0] });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getSubscriptions,
  getActiveSubscription,
  createSubscription,
  updateSubscription,
};

