const database = require('../config/database');

// Get all bills for a PG
const getBills = async (req, res) => {
  try {
    const { pg_id } = req.params;
    const { role, pg_id: userPgId } = req.user;

    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [bills] = await database.query(
      'SELECT * FROM bills WHERE pg_id = ? ORDER BY bill_month DESC, created_at DESC',
      [pg_id]
    );

    res.json({ bills });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single bill with allocations
const getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, pg_id } = req.user;

    const [bills] = await database.query('SELECT * FROM bills WHERE id = ?', [id]);
    if (bills.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    if (role === 'pg_admin' && pg_id != bills[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get allocations
    const [allocations] = await database.query(
      `SELECT ba.*, t.name as tenant_name, t.phone as tenant_phone 
       FROM bill_allocations ba 
       JOIN tenants t ON ba.tenant_id = t.id 
       WHERE ba.bill_id = ?`,
      [id]
    );

    res.json({ bill: bills[0], allocations });
  } catch (error) {
    console.error('Get bill by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create bill
const createBill = async (req, res) => {
  try {
    const { pg_id, bill_type, amount, bill_month, description, allocations } = req.body;
    const { role, pg_id: userPgId } = req.user;

    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!pg_id || !bill_type || !amount || !bill_month) {
      return res.status(400).json({ error: 'Missing required fields' });
    }


    const connection = await database.getConnection();
    await connection.beginTransaction();

    try {
      // Create bill
      const [result] = await connection.query(
        'INSERT INTO bills (pg_id, bill_type, amount, bill_month, description) VALUES (?, ?, ?, ?, ?)',
        [pg_id, bill_type, amount, bill_month, description || null]
      );

      const billId = result.insertId;

      // Create allocations if provided
      if (allocations && Array.isArray(allocations) && allocations.length > 0) {
        const allocationInserts = allocations.map((alloc) => [billId, alloc.tenant_id, alloc.amount]);
        await connection.query(
          'INSERT INTO bill_allocations (bill_id, tenant_id, amount) VALUES ?',
          [allocationInserts]
        );
      }

      await connection.commit();

      const [bills] = await database.query('SELECT * FROM bills WHERE id = ?', [billId]);
      res.status(201).json({ message: 'Bill created successfully', bill: bills[0] });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update bill
const updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { bill_type, amount, bill_month, description, allocations } = req.body;
    const { role, pg_id } = req.user;

    const [bills] = await database.query('SELECT * FROM bills WHERE id = ?', [id]);
    if (bills.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    if (role === 'pg_admin' && pg_id != bills[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const connection = await database.getConnection();
    await connection.beginTransaction();

    try {
      // Update bill
      await connection.query(
        'UPDATE bills SET bill_type = ?, amount = ?, bill_month = ?, description = ? WHERE id = ?',
        [bill_type, amount, bill_month, description !== undefined ? description : bills[0].description, id]
      );

      // Delete old allocations
      await connection.query('DELETE FROM bill_allocations WHERE bill_id = ?', [id]);

      // Create new allocations
      if (allocations && Array.isArray(allocations) && allocations.length > 0) {
        const allocationInserts = allocations.map((alloc) => [id, alloc.tenant_id, alloc.amount]);
        await connection.query(
          'INSERT INTO bill_allocations (bill_id, tenant_id, amount) VALUES ?',
          [allocationInserts]
        );
      }

      await connection.commit();

      const [updatedBills] = await database.query('SELECT * FROM bills WHERE id = ?', [id]);
      res.json({ message: 'Bill updated successfully', bill: updatedBills[0] });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update bill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete bill
const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, pg_id } = req.user;

    const [bills] = await database.query('SELECT * FROM bills WHERE id = ?', [id]);
    if (bills.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    if (role === 'pg_admin' && pg_id != bills[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await database.query('DELETE FROM bills WHERE id = ?', [id]);
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Delete bill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getBills,
  getBillById,
  createBill,
  updateBill,
  deleteBill,
};

