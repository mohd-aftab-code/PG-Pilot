const database = require('../config/database');

// Get all invoices for a PG
const getInvoices = async (req, res) => {
  try {
    const { pg_id } = req.params;
    const { role, pg_id: userPgId } = req.user;

    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [invoices] = await database.query(
      'SELECT * FROM invoices WHERE pg_id = ? ORDER BY invoice_date DESC',
      [pg_id]
    );

    res.json({ invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single invoice
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, pg_id } = req.user;

    const [invoices] = await database.query('SELECT * FROM invoices WHERE id = ?', [id]);
    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (role === 'pg_admin' && pg_id != invoices[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ invoice: invoices[0] });
  } catch (error) {
    console.error('Get invoice by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create invoice
const createInvoice = async (req, res) => {
  try {
    const { pg_id, amount, invoice_date, due_date } = req.body;
    const { role, pg_id: userPgId } = req.user;

    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!pg_id || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await database.query(
      'INSERT INTO invoices (pg_id, amount, invoice_date, due_date) VALUES (?, ?, ?, ?)',
      [pg_id, amount, invoice_date || new Date().toISOString().split('T')[0], due_date || null]
    );

    const [invoices] = await database.query('SELECT * FROM invoices WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Invoice created successfully', invoice: invoices[0] });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update invoice
const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, invoice_date, due_date, status } = req.body;
    const { role, pg_id } = req.user;

    const [invoices] = await database.query('SELECT * FROM invoices WHERE id = ?', [id]);
    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (role === 'pg_admin' && pg_id != invoices[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (status && !['unpaid', 'paid'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await database.query(
      'UPDATE invoices SET amount = ?, invoice_date = ?, due_date = ?, status = ? WHERE id = ?',
      [amount, invoice_date, due_date, status, id]
    );

    const [updatedInvoices] = await database.query('SELECT * FROM invoices WHERE id = ?', [id]);
    res.json({ message: 'Invoice updated successfully', invoice: updatedInvoices[0] });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete invoice
const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, pg_id } = req.user;

    const [invoices] = await database.query('SELECT * FROM invoices WHERE id = ?', [id]);
    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (role === 'pg_admin' && pg_id != invoices[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await database.query('DELETE FROM invoices WHERE id = ?', [id]);
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
};

