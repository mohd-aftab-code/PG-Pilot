const database = require('../config/database');

// Get all referrals
const getReferrals = async (req, res) => {
  try {
    const { role, pg_id } = req.user;

    let query = `
      SELECT r.*, 
             p1.name as referred_by_name, p1.pg_uid as referred_by_uid,
             p2.name as referred_pg_name, p2.pg_uid as referred_pg_uid
      FROM referrals r
      LEFT JOIN pgs p1 ON r.referred_by = p1.id
      LEFT JOIN pgs p2 ON r.referred_pg = p2.id
    `;

    if (role === 'pg_admin') {
      query += ' WHERE r.referred_by = ? OR r.referred_pg = ?';
      const [referrals] = await database.query(query, [pg_id, pg_id]);
      return res.json({ referrals });
    }

    const [referrals] = await database.query(query + ' ORDER BY r.id DESC');
    res.json({ referrals });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create referral
const createReferral = async (req, res) => {
  try {
    const { referred_by, referred_pg, reward_days } = req.body;
    const { role, pg_id } = req.user;

    if (!referred_by || !referred_pg) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (role === 'pg_admin' && pg_id != referred_by) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if referral already exists
    const [existing] = await database.query(
      'SELECT id FROM referrals WHERE referred_by = ? AND referred_pg = ?',
      [referred_by, referred_pg]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Referral already exists' });
    }

    const [result] = await database.query(
      'INSERT INTO referrals (referred_by, referred_pg, reward_days) VALUES (?, ?, ?)',
      [referred_by, referred_pg, reward_days || 7]
    );

    const [referrals] = await database.query(
      `SELECT r.*, 
       p1.name as referred_by_name, p1.pg_uid as referred_by_uid,
       p2.name as referred_pg_name, p2.pg_uid as referred_pg_uid
       FROM referrals r
       LEFT JOIN pgs p1 ON r.referred_by = p1.id
       LEFT JOIN pgs p2 ON r.referred_pg = p2.id
       WHERE r.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: 'Referral created successfully', referral: referrals[0] });
  } catch (error) {
    console.error('Create referral error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Activate referral (Superadmin only)
const activateReferral = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can activate referrals' });
    }

    const { id } = req.params;

    const [referrals] = await database.query('SELECT * FROM referrals WHERE id = ?', [id]);
    if (referrals.length === 0) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    await database.query('UPDATE referrals SET status = "activated" WHERE id = ?', [id]);

    // Extend subscription for referred_pg
    const referral = referrals[0];
    const [subscriptions] = await database.query(
      'SELECT * FROM pg_subscriptions WHERE pg_id = ? ORDER BY expiry_date DESC LIMIT 1',
      [referral.referred_pg]
    );

    if (subscriptions.length > 0) {
      const subscription = subscriptions[0];
      const newExpiryDate = new Date(subscription.expiry_date);
      newExpiryDate.setDate(newExpiryDate.getDate() + referral.reward_days);

      await database.query(
        'UPDATE pg_subscriptions SET expiry_date = ? WHERE id = ?',
        [newExpiryDate.toISOString().split('T')[0], subscription.id]
      );
    }

    const [updatedReferrals] = await database.query(
      `SELECT r.*, 
       p1.name as referred_by_name, p1.pg_uid as referred_by_uid,
       p2.name as referred_pg_name, p2.pg_uid as referred_pg_uid
       FROM referrals r
       LEFT JOIN pgs p1 ON r.referred_by = p1.id
       LEFT JOIN pgs p2 ON r.referred_pg = p2.id
       WHERE r.id = ?`,
      [id]
    );

    res.json({ message: 'Referral activated successfully', referral: updatedReferrals[0] });
  } catch (error) {
    console.error('Activate referral error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getReferrals,
  createReferral,
  activateReferral,
};

