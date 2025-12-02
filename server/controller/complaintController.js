const database = require('../config/database');

// Get all complaints for a PG
const getComplaints = async (req, res) => {
  try {
    const { pg_id } = req.params;
    const { role, pg_id: userPgId } = req.user;

    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [complaints] = await database.query(
      `SELECT c.*, t.name as tenant_name, t.phone as tenant_phone 
       FROM complaints c 
       JOIN tenants t ON c.tenant_id = t.id 
       WHERE c.pg_id = ? 
       ORDER BY c.created_at DESC`,
      [pg_id]
    );

    res.json({ complaints });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get complaints by tenant
const getComplaintsByTenant = async (req, res) => {
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

    const [complaints] = await database.query(
      'SELECT * FROM complaints WHERE tenant_id = ? ORDER BY created_at DESC',
      [tenant_id]
    );

    res.json({ complaints });
  } catch (error) {
    console.error('Get complaints by tenant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single complaint
const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, pg_id } = req.user;

    const [complaints] = await database.query(
      `SELECT c.*, t.name as tenant_name, t.phone as tenant_phone 
       FROM complaints c 
       JOIN tenants t ON c.tenant_id = t.id 
       WHERE c.id = ?`,
      [id]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (role === 'pg_admin' && pg_id != complaints[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ complaint: complaints[0] });
  } catch (error) {
    console.error('Get complaint by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create complaint
const createComplaint = async (req, res) => {
  try {
    const { tenant_id, pg_id, title, description, photo_url } = req.body;
    const { role, pg_id: userPgId } = req.user;

    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!tenant_id || !pg_id || !title) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await database.query(
      'INSERT INTO complaints (tenant_id, pg_id, title, description, photo_url) VALUES (?, ?, ?, ?, ?)',
      [tenant_id, pg_id, title, description || null, photo_url || null]
    );

    const [complaints] = await database.query(
      `SELECT c.*, t.name as tenant_name 
       FROM complaints c 
       JOIN tenants t ON c.tenant_id = t.id 
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: 'Complaint created successfully', complaint: complaints[0] });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update complaint
const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, photo_url, status } = req.body;
    const { role, pg_id } = req.user;

    const [complaints] = await database.query('SELECT * FROM complaints WHERE id = ?', [id]);
    if (complaints.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (role === 'pg_admin' && pg_id != complaints[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (status && !['open', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await database.query(
      'UPDATE complaints SET title = ?, description = ?, photo_url = ?, status = ? WHERE id = ?',
      [title, description, photo_url, status, id]
    );

    const [updatedComplaints] = await database.query(
      `SELECT c.*, t.name as tenant_name 
       FROM complaints c 
       JOIN tenants t ON c.tenant_id = t.id 
       WHERE c.id = ?`,
      [id]
    );

    res.json({ message: 'Complaint updated successfully', complaint: updatedComplaints[0] });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete complaint
const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, pg_id } = req.user;

    const [complaints] = await database.query('SELECT * FROM complaints WHERE id = ?', [id]);
    if (complaints.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (role === 'pg_admin' && pg_id != complaints[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await database.query('DELETE FROM complaints WHERE id = ?', [id]);
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getComplaints,
  getComplaintsByTenant,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
};

