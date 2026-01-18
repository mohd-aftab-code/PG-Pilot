const database = require('../config/database');

// Get all mess bills for a PG
const getMessBills = async (req, res) => {
  try {
    const { pg_id } = req.params;
    const { role, pg_id: userPgId } = req.user;

    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [bills] = await database.query(
      `SELECT mb.* 
       FROM mess_bills mb 
       WHERE mb.pg_id = ? 
       ORDER BY mb.month_for DESC`,
      [pg_id]
    );

    res.json({ mess_bills: bills });
  } catch (error) {
    console.error('Get mess bills error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get mess bills by tenant
const getMessBillsByTenant = async (req, res) => {
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

    const [bills] = await database.query(
      'SELECT * FROM mess_bills WHERE tenant_id = ? ORDER BY month_for DESC',
      [tenant_id]
    );

    res.json({ mess_bills: bills });
  } catch (error) {
    console.error('Get mess bills by tenant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create mess bill
const createMessBill = async (req, res) => {
  try {
    const { pg_id, month_for, amount, description } = req.body;
    const { role, pg_id: userPgId } = req.user;

    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!pg_id || !month_for || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await database.query(
      'INSERT INTO mess_bills (pg_id, month_for, amount, description) VALUES (?, ?, ?, ?)',
      [pg_id, month_for, amount, description || null]
    );

    const [bills] = await database.query(
      'SELECT * FROM mess_bills WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ message: 'Mess bill created successfully', mess_bill: bills[0] });
  } catch (error) {
    console.error('Create mess bill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update mess bill
const updateMessBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { month_for, amount, description } = req.body;
    const { role, pg_id } = req.user;

    const [bills] = await database.query('SELECT * FROM mess_bills WHERE id = ?', [id]);
    if (bills.length === 0) {
      return res.status(404).json({ error: 'Mess bill not found' });
    }

    if (role === 'pg_admin' && pg_id != bills[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await database.query(
      'UPDATE mess_bills SET month_for = ?, amount = ?, description = ? WHERE id = ?',
      [month_for || bills[0].month_for, amount || bills[0].amount, description !== undefined ? description : bills[0].description, id]
    );

    const [updatedBills] = await database.query(
      'SELECT * FROM mess_bills WHERE id = ?',
      [id]
    );

    res.json({ message: 'Mess bill updated successfully', mess_bill: updatedBills[0] });
  } catch (error) {
    console.error('Update mess bill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete mess bill
const deleteMessBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, pg_id } = req.user;

    const [bills] = await database.query('SELECT * FROM mess_bills WHERE id = ?', [id]);
    if (bills.length === 0) {
      return res.status(404).json({ error: 'Mess bill not found' });
    }

    if (role === 'pg_admin' && pg_id != bills[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await database.query('DELETE FROM mess_bills WHERE id = ?', [id]);
    res.json({ message: 'Mess bill deleted successfully' });
  } catch (error) {
    console.error('Delete mess bill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getMessBills,
  getMessBillsByTenant,
  createMessBill,
  updateMessBill,
  deleteMessBill,
};

