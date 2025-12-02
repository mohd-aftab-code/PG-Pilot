const database = require('../config/database');

// Get all subscriptions for a PG
const getSubscriptions = async (req, res) => {
  try {
    const { pg_id } = req.params;
    const { role, pg_id: userPgId } = req.user;

    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [subscriptions] = await database.query(
      `SELECT ps.*, p.name as plan_name, p.price as plan_price, p.duration_days 
       FROM pg_subscriptions ps 
       JOIN plans p ON ps.plan_id = p.id 
       WHERE ps.pg_id = ? 
       ORDER BY ps.start_date DESC`,
      [pg_id]
    );

    res.json({ subscriptions });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current active subscription
const getActiveSubscription = async (req, res) => {
  try {
    const { pg_id } = req.params;
    const { role, pg_id: userPgId } = req.user;

    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [subscriptions] = await database.query(
      `SELECT ps.*, p.name as plan_name, p.price as plan_price, p.duration_days 
       FROM pg_subscriptions ps 
       JOIN plans p ON ps.plan_id = p.id 
       WHERE ps.pg_id = ? AND ps.expiry_date >= CURDATE() 
       ORDER BY ps.expiry_date DESC 
       LIMIT 1`,
      [pg_id]
    );

    res.json({ subscription: subscriptions.length > 0 ? subscriptions[0] : null });
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

