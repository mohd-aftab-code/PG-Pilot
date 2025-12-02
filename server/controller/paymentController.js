const database = require('../config/database');

// Get payments by PG
const getPayments = async (req, res) => {
  try {
    const { pg_id } = req.params;
    const { role, pg_id: userPgId } = req.user;

    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [payments] = await database.query(
      `SELECT p.*, t.name as tenant_name 
       FROM payments p 
       JOIN tenants t ON p.tenant_id = t.id 
       WHERE p.pg_id = ? 
       ORDER BY p.created_at DESC`,
      [pg_id]
    );

    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get payments by tenant
const getPaymentsByTenant = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    const { role, pg_id: userPgId } = req.user;

    const [payments] = await database.query(
      `SELECT p.*, t.name as tenant_name, t.pg_id 
       FROM payments p 
       JOIN tenants t ON p.tenant_id = t.id 
       WHERE p.tenant_id = ? 
       ORDER BY p.created_at DESC`,
      [tenant_id]
    );

    if (payments.length > 0 && role === 'pg_admin' && userPgId != payments[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ payments });
  } catch (error) {
    console.error('Get payments by tenant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create payment
const createPayment = async (req, res) => {
  try {
    const { tenant_id, pg_id, amount, month_for, mode, transaction_id, receipt_url } = req.body;
    const { role, pg_id: userPgId } = req.user;

    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!tenant_id || !pg_id || !amount || !month_for || !mode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['cash', 'qr', 'manual'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid payment mode' });
    }

    const [result] = await database.query(
      'INSERT INTO payments (tenant_id, pg_id, amount, month_for, mode, status, transaction_id, receipt_url) VALUES (?, ?, ?, ?, ?, "received", ?, ?)',
      [tenant_id, pg_id, amount, month_for, mode, transaction_id || null, receipt_url || null]
    );

    const [payments] = await database.query(
      `SELECT p.*, t.name as tenant_name 
       FROM payments p 
       JOIN tenants t ON p.tenant_id = t.id 
       WHERE p.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: 'Payment recorded successfully', payment: payments[0] });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update payment
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, month_for, mode, status, transaction_id, receipt_url } = req.body;
    const { role, pg_id: userPgId } = req.user;

    // Get payment to check access
    const [payments] = await database.query(
      `SELECT p.*, t.pg_id 
       FROM payments p 
       JOIN tenants t ON p.tenant_id = t.id 
       WHERE p.id = ?`,
      [id]
    );

    if (payments.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (role === 'pg_admin' && userPgId != payments[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await database.query(
      'UPDATE payments SET amount = ?, month_for = ?, mode = ?, status = ?, transaction_id = ?, receipt_url = ? WHERE id = ?',
      [amount, month_for, mode, status, transaction_id || null, receipt_url || null, id]
    );

    const [updatedPayments] = await database.query(
      `SELECT p.*, t.name as tenant_name 
       FROM payments p 
       JOIN tenants t ON p.tenant_id = t.id 
       WHERE p.id = ?`,
      [id]
    );

    res.json({ message: 'Payment updated successfully', payment: updatedPayments[0] });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete payment
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, pg_id: userPgId } = req.user;

    // Get payment to check access
    const [payments] = await database.query(
      `SELECT p.*, t.pg_id 
       FROM payments p 
       JOIN tenants t ON p.tenant_id = t.id 
       WHERE p.id = ?`,
      [id]
    );

    if (payments.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (role === 'pg_admin' && userPgId != payments[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await database.query('DELETE FROM payments WHERE id = ?', [id]);
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getPayments,
  getPaymentsByTenant,
  createPayment,
  updatePayment,
  deletePayment,
};
