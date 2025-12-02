const database = require('../config/database');

// Assign mess plan to tenant
const assignMessPlan = async (req, res) => {
  try {
    const { tenant_id, mess_plan_id, start_date } = req.body;
    const { role, pg_id } = req.user;

    if (!tenant_id || !mess_plan_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify tenant access
    const [tenants] = await database.query('SELECT pg_id FROM tenants WHERE id = ?', [tenant_id]);
    if (tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (role === 'pg_admin' && pg_id != tenants[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify mess plan belongs to same PG
    const [plans] = await database.query('SELECT pg_id FROM mess_plans WHERE id = ?', [mess_plan_id]);
    if (plans.length === 0) {
      return res.status(404).json({ error: 'Mess plan not found' });
    }

    if (plans[0].pg_id != tenants[0].pg_id) {
      return res.status(400).json({ error: 'Mess plan does not belong to tenant\'s PG' });
    }

    // Remove existing assignment
    await database.query('DELETE FROM tenant_mess WHERE tenant_id = ?', [tenant_id]);

    // Create new assignment
    const [result] = await database.query(
      'INSERT INTO tenant_mess (tenant_id, mess_plan_id, start_date) VALUES (?, ?, ?)',
      [tenant_id, mess_plan_id, start_date || new Date().toISOString().split('T')[0]]
    );

    const [assignments] = await database.query(
      `SELECT tm.*, mp.name as plan_name, mp.price 
       FROM tenant_mess tm 
       JOIN mess_plans mp ON tm.mess_plan_id = mp.id 
       WHERE tm.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: 'Mess plan assigned successfully', assignment: assignments[0] });
  } catch (error) {
    console.error('Assign mess plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get tenant mess assignment
const getTenantMess = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    const { role, pg_id } = req.user;

    const [tenants] = await database.query('SELECT pg_id FROM tenants WHERE id = ?', [tenant_id]);
    if (tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (role === 'pg_admin' && pg_id != tenants[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [assignments] = await database.query(
      `SELECT tm.*, mp.name as plan_name, mp.price 
       FROM tenant_mess tm 
       JOIN mess_plans mp ON tm.mess_plan_id = mp.id 
       WHERE tm.tenant_id = ?`,
      [tenant_id]
    );

    res.json({ assignment: assignments.length > 0 ? assignments[0] : null });
  } catch (error) {
    console.error('Get tenant mess error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove mess plan assignment
const removeMessPlan = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    const { role, pg_id } = req.user;

    const [tenants] = await database.query('SELECT pg_id FROM tenants WHERE id = ?', [tenant_id]);
    if (tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (role === 'pg_admin' && pg_id != tenants[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await database.query('DELETE FROM tenant_mess WHERE tenant_id = ?', [tenant_id]);
    res.json({ message: 'Mess plan assignment removed successfully' });
  } catch (error) {
    console.error('Remove mess plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  assignMessPlan,
  getTenantMess,
  removeMessPlan,
};

