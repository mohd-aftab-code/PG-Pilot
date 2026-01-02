const database = require('../config/database');

// Get all tenants for a PG
const getTenants = async (req, res) => {
  try {
    const { pg_id } = req.params;
    const { role, pg_id: userPgId } = req.user;

    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [tenants] = await database.query(
      `SELECT t.*, b.bed_number, r.room_name 
       FROM tenants t 
       LEFT JOIN beds b ON t.bed_id = b.id 
       LEFT JOIN rooms r ON b.room_id = r.id 
       WHERE t.pg_id = ? 
       ORDER BY t.created_at DESC, t.id DESC`,
      [pg_id]
    );

    res.json({ tenants });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single tenant
const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, pg_id } = req.user;

    const [tenants] = await database.query(
      `SELECT t.*, b.bed_number, r.room_name, r.id as room_id 
       FROM tenants t 
       LEFT JOIN beds b ON t.bed_id = b.id 
       LEFT JOIN rooms r ON b.room_id = r.id 
       WHERE t.id = ?`,
      [id]
    );

    if (tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (role === 'pg_admin' && pg_id != tenants[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ tenant: tenants[0] });
  } catch (error) {
    console.error('Get tenant by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create tenant
const createTenant = async (req, res) => {
  try {
    const { pg_id, bed_id, name, phone, email, join_date, rent_amount, deposit_amount } = req.body;
    const { role, pg_id: userPgId } = req.user;

    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!pg_id || !name) {
      return res.status(400).json({ error: 'PG ID and name are required' });
    }

    // Handle Aadhaar document upload
    const aadhaar_url = req.file ? `/uploads/tenant-docs/${req.file.filename}` : null;

    // If bed_id provided, check and update bed status
    if (bed_id) {
      const [beds] = await database.query(
        'SELECT b.*, r.pg_id FROM beds b JOIN rooms r ON b.room_id = r.id WHERE b.id = ?',
        [bed_id]
      );

      if (beds.length === 0) {
        return res.status(404).json({ error: 'Bed not found' });
      }

      if (beds[0].pg_id != pg_id) {
        return res.status(400).json({ error: 'Bed does not belong to this PG' });
      }

      if (beds[0].status !== 'vacant') {
        return res.status(400).json({ error: 'Bed is not vacant' });
      }

      await database.query('UPDATE beds SET status = "occupied" WHERE id = ?', [bed_id]);
    }

    const [result] = await database.query(
      'INSERT INTO tenants (pg_id, bed_id, name, phone, email, aadhaar_url, join_date, rent_amount, deposit_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [pg_id, bed_id || null, name, phone || null, email || null, aadhaar_url, join_date || null, rent_amount || null, deposit_amount || null]
    );

    const [tenants] = await database.query(
      `SELECT t.*, b.bed_number, r.room_name 
       FROM tenants t 
       LEFT JOIN beds b ON t.bed_id = b.id 
       LEFT JOIN rooms r ON b.room_id = r.id 
       WHERE t.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: 'Tenant created successfully', tenant: tenants[0] });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update tenant
const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { bed_id, name, phone, email, join_date, rent_amount, deposit_amount, is_active } = req.body;
    const { role, pg_id } = req.user;

    const [tenants] = await database.query('SELECT * FROM tenants WHERE id = ?', [id]);
    if (tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (role === 'pg_admin' && pg_id != tenants[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Handle Aadhaar document upload - only update if new file is uploaded
    let aadhaar_url = tenants[0].aadhaar_url; // Keep existing if no new file
    if (req.file) {
      aadhaar_url = `/uploads/tenant-docs/${req.file.filename}`;
    }

    // Handle bed change
    if (bed_id !== undefined && bed_id !== tenants[0].bed_id) {
      // Free old bed
      if (tenants[0].bed_id) {
        await database.query('UPDATE beds SET status = "vacant" WHERE id = ?', [tenants[0].bed_id]);
      }

      // Occupy new bed
      if (bed_id) {
        const [beds] = await database.query('SELECT * FROM beds WHERE id = ?', [bed_id]);
        if (beds.length === 0 || beds[0].status !== 'vacant') {
          return res.status(400).json({ error: 'Bed is not available' });
        }
        await database.query('UPDATE beds SET status = "occupied" WHERE id = ?', [bed_id]);
      }
    }

    await database.query(
      'UPDATE tenants SET bed_id = ?, name = ?, phone = ?, email = ?, aadhaar_url = ?, join_date = ?, rent_amount = ?, deposit_amount = ?, is_active = ? WHERE id = ?',
      [bed_id !== undefined ? bed_id : tenants[0].bed_id, name, phone, email, aadhaar_url, join_date, rent_amount, deposit_amount, is_active !== undefined ? is_active : tenants[0].is_active, id]
    );

    const [updatedTenants] = await database.query(
      `SELECT t.*, b.bed_number, r.room_name 
       FROM tenants t 
       LEFT JOIN beds b ON t.bed_id = b.id 
       LEFT JOIN rooms r ON b.room_id = r.id 
       WHERE t.id = ?`,
      [id]
    );

    res.json({ message: 'Tenant updated successfully', tenant: updatedTenants[0] });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete tenant
const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, pg_id } = req.user;

    const [tenants] = await database.query('SELECT * FROM tenants WHERE id = ?', [id]);
    if (tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (role === 'pg_admin' && pg_id != tenants[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Free the bed
    if (tenants[0].bed_id) {
      await database.query('UPDATE beds SET status = "vacant" WHERE id = ?', [tenants[0].bed_id]);
    }

    await database.query('DELETE FROM tenants WHERE id = ?', [id]);
    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
};

