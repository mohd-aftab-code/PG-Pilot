const database = require('../config/database');

// Get all beds for a room
const getBeds = async (req, res) => {
  try {
    const { room_id } = req.params;
    const { role, pg_id } = req.user;

    // Verify room access
    const [rooms] = await database.query('SELECT pg_id FROM rooms WHERE id = ?', [room_id]);
    if (rooms.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (role === 'pg_admin' && pg_id != rooms[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [beds] = await database.query(
      'SELECT * FROM beds WHERE room_id = ? ORDER BY bed_number',
      [room_id]
    );

    res.json({ beds });
  } catch (error) {
    console.error('Get beds error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single bed
const getBedById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, pg_id } = req.user;

    const [beds] = await database.query(
      'SELECT b.*, r.pg_id FROM beds b JOIN rooms r ON b.room_id = r.id WHERE b.id = ?',
      [id]
    );

    if (beds.length === 0) {
      return res.status(404).json({ error: 'Bed not found' });
    }

    if (role === 'pg_admin' && pg_id != beds[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ bed: beds[0] });
  } catch (error) {
    console.error('Get bed by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update bed status
const updateBedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role, pg_id } = req.user;

    if (!['vacant', 'occupied', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const [beds] = await database.query(
      'SELECT b.*, r.pg_id FROM beds b JOIN rooms r ON b.room_id = r.id WHERE b.id = ?',
      [id]
    );

    if (beds.length === 0) {
      return res.status(404).json({ error: 'Bed not found' });
    }

    if (role === 'pg_admin' && pg_id != beds[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await database.query('UPDATE beds SET status = ? WHERE id = ?', [status, id]);

    const [updatedBeds] = await database.query('SELECT * FROM beds WHERE id = ?', [id]);
    res.json({ message: 'Bed status updated successfully', bed: updatedBeds[0] });
  } catch (error) {
    console.error('Update bed status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getBeds,
  getBedById,
  updateBedStatus,
};

