const database = require('../config/database');

// Get all mess plans for a PG
const getMessPlans = async (req, res) => {
  try {
    const { pg_id } = req.params;
    const { role, pg_id: userPgId } = req.user;

    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [plans] = await database.query(
      'SELECT * FROM mess_plans WHERE pg_id = ? ORDER BY name',
      [pg_id]
    );

    // Parse schedule JSON for each plan
    const plansWithSchedule = plans.map(plan => {
      if (plan.schedule && typeof plan.schedule === 'string') {
        try {
          plan.schedule = JSON.parse(plan.schedule);
        } catch (e) {
          plan.schedule = null;
        }
      }
      return plan;
    });

    res.json({ mess_plans: plansWithSchedule });
  } catch (error) {
    console.error('Get mess plans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create mess plan
const createMessPlan = async (req, res) => {
  try {
    const { pg_id, name, price, schedule } = req.body;
    const { role, pg_id: userPgId } = req.user;

    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!pg_id || !name || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert schedule object to JSON string if provided
    const scheduleJson = schedule ? JSON.stringify(schedule) : null;

    const [result] = await database.query(
      'INSERT INTO mess_plans (pg_id, name, price, schedule) VALUES (?, ?, ?, ?)',
      [pg_id, name, price, scheduleJson]
    );

    const [plans] = await database.query('SELECT * FROM mess_plans WHERE id = ?', [result.insertId]);
    // Parse schedule JSON if exists
    if (plans[0].schedule && typeof plans[0].schedule === 'string') {
      plans[0].schedule = JSON.parse(plans[0].schedule);
    }
    res.status(201).json({ message: 'Mess plan created successfully', mess_plan: plans[0] });
  } catch (error) {
    console.error('Create mess plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update mess plan
const updateMessPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, schedule } = req.body;
    const { role, pg_id } = req.user;

    const [plans] = await database.query('SELECT * FROM mess_plans WHERE id = ?', [id]);
    if (plans.length === 0) {
      return res.status(404).json({ error: 'Mess plan not found' });
    }

    if (role === 'pg_admin' && pg_id != plans[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Convert schedule object to JSON string if provided
    const scheduleJson = schedule ? JSON.stringify(schedule) : null;

    await database.query('UPDATE mess_plans SET name = ?, price = ?, schedule = ? WHERE id = ?', [name, price, scheduleJson, id]);

    const [updatedPlans] = await database.query('SELECT * FROM mess_plans WHERE id = ?', [id]);
    // Parse schedule JSON if exists
    if (updatedPlans[0].schedule && typeof updatedPlans[0].schedule === 'string') {
      updatedPlans[0].schedule = JSON.parse(updatedPlans[0].schedule);
    }
    res.json({ message: 'Mess plan updated successfully', mess_plan: updatedPlans[0] });
  } catch (error) {
    console.error('Update mess plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete mess plan
const deleteMessPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, pg_id } = req.user;

    const [plans] = await database.query('SELECT * FROM mess_plans WHERE id = ?', [id]);
    if (plans.length === 0) {
      return res.status(404).json({ error: 'Mess plan not found' });
    }

    if (role === 'pg_admin' && pg_id != plans[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await database.query('DELETE FROM mess_plans WHERE id = ?', [id]);
    res.json({ message: 'Mess plan deleted successfully' });
  } catch (error) {
    console.error('Delete mess plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getMessPlans,
  createMessPlan,
  updateMessPlan,
  deleteMessPlan,
};

