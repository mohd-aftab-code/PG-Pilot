const database = require('../config/database');

// Get all plans (Superadmin only)
const getPlans = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can view plans' });
    }

    const [plans] = await database.query('SELECT * FROM plans ORDER BY price');
    res.json({ plans });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all plans (Public endpoint for landing page)
const getPublicPlans = async (req, res) => {
  try {
    const [plans] = await database.query('SELECT id, name, price, duration_days, max_pgs, max_rooms, max_beds, description FROM plans ORDER BY price');
    res.json({ plans });
  } catch (error) {
    console.error('Get public plans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single plan
const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const [plans] = await database.query('SELECT * FROM plans WHERE id = ?', [id]);
    if (plans.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json({ plan: plans[0] });
  } catch (error) {
    console.error('Get plan by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create plan (Superadmin only)
const createPlan = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can create plans' });
    }

    const { name, price, duration_days, max_pgs, max_rooms, max_beds, description } = req.body;

    if (!name || !price || !duration_days) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await database.query(
      'INSERT INTO plans (name, price, duration_days, max_pgs, max_rooms, max_beds, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, price, duration_days, max_pgs || 1, max_rooms || 10, max_beds || 50, description || null]
    );

    const [plans] = await database.query('SELECT * FROM plans WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Plan created successfully', plan: plans[0] });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update plan (Superadmin only)
const updatePlan = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can update plans' });
    }

    const { id } = req.params;
    const { name, price, duration_days, max_pgs, max_rooms, max_beds, description } = req.body;

    await database.query(
      'UPDATE plans SET name = ?, price = ?, duration_days = ?, max_pgs = ?, max_rooms = ?, max_beds = ?, description = ? WHERE id = ?',
      [name, price, duration_days, max_pgs || 1, max_rooms || 10, max_beds || 50, description || null, id]
    );

    const [plans] = await database.query('SELECT * FROM plans WHERE id = ?', [id]);
    res.json({ message: 'Plan updated successfully', plan: plans[0] });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete plan (Superadmin only)
const deletePlan = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can delete plans' });
    }

    const { id } = req.params;
    await database.query('DELETE FROM plans WHERE id = ?', [id]);
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getPlans,
  getPublicPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
};

