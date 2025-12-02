const database = require('../config/database');

// Get all PGs (Superadmin) or single PG (PG Admin)
const getPGs = async (req, res) => {
  try {
    const { role, pg_id } = req.user;

    if (role === 'pg_admin' && pg_id) {
      const [pgs] = await database.query(
        'SELECT * FROM pgs WHERE id = ?',
        [pg_id]
      );
      return res.json({ pgs: pgs.length > 0 ? [pgs[0]] : [] });
    }

    // Superadmin - get all
    const [pgs] = await database.query('SELECT * FROM pgs ORDER BY created_at DESC');
    res.json({ pgs });
  } catch (error) {
    console.error('Get PGs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single PG by ID
const getPGById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, pg_id } = req.user;

    if (role === 'pg_admin' && pg_id != id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [pgs] = await database.query('SELECT * FROM pgs WHERE id = ?', [id]);
    if (pgs.length === 0) {
      return res.status(404).json({ error: 'PG not found' });
    }

    res.json({ pg: pgs[0] });
  } catch (error) {
    console.error('Get PG by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create PG (Superadmin can create any PG, pg_admin can create their own)
const createPG = async (req, res) => {
  try {
    const { name, address, food_enabled, default_due_day } = req.body;
    const { role, id: userId, pg_id: userPgId } = req.user;

    if (!name) {
      return res.status(400).json({ error: 'PG name is required' });
    }

    // If user is pg_admin and already has a PG, don't allow creating another
    if (role === 'pg_admin' && userPgId) {
      return res.status(403).json({ error: 'You already have a PG assigned. Please contact support to create another.' });
    }

    // Insert PG first
    const [result] = await database.query(
      'INSERT INTO pgs (name, address, food_enabled, default_due_day) VALUES (?, ?, ?, ?)',
      [name, address || null, food_enabled || 0, default_due_day || 5]
    );

    const pgId = result.insertId;
    
    // Generate and update pg_uid (avoiding trigger conflict)
    const pgUid = `PG_ID_${String(pgId).padStart(3, '0')}`;
    await database.query(
      'UPDATE pgs SET pg_uid = ? WHERE id = ?',
      [pgUid, pgId]
    );

    // If user is pg_admin, assign the PG to them
    if (role === 'pg_admin') {
      await database.query(
        'UPDATE users SET pg_id = ? WHERE id = ?',
        [pgId, userId]
      );
    }

    // Fetch the created PG (with auto-generated pg_uid)
    const [pgs] = await database.query('SELECT * FROM pgs WHERE id = ?', [pgId]);

    res.status(201).json({ 
      message: 'PG created successfully', 
      pg: pgs[0],
      user_updated: role === 'pg_admin' // Indicate if user was updated
    });
  } catch (error) {
    console.error('Create PG error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update PG
const updatePG = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, pg_id } = req.user;
    const { name, address, food_enabled, default_due_day } = req.body;

    if (role === 'pg_admin' && pg_id != id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await database.query(
      'UPDATE pgs SET name = ?, address = ?, food_enabled = ?, default_due_day = ? WHERE id = ?',
      [name, address, food_enabled, default_due_day, id]
    );

    const [pgs] = await database.query('SELECT * FROM pgs WHERE id = ?', [id]);
    res.json({ message: 'PG updated successfully', pg: pgs[0] });
  } catch (error) {
    console.error('Update PG error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete PG (Superadmin only)
const deletePG = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can delete PGs' });
    }

    const { id } = req.params;
    await database.query('DELETE FROM pgs WHERE id = ?', [id]);
    res.json({ message: 'PG deleted successfully' });
  } catch (error) {
    console.error('Delete PG error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getPGs,
  getPGById,
  createPG,
  updatePG,
  deletePG,
};

