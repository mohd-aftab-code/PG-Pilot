const database = require('../config/database');
const { canCreateRoom, canCreateBed } = require('../utils/subscriptionUtils');

// Get all rooms for a PG
const getRooms = async (req, res) => {
  try {
    const { pg_id } = req.params;
    const { role, pg_id: userPgId } = req.user;

    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [rooms] = await database.query(
      'SELECT * FROM rooms WHERE pg_id = ? ORDER BY room_name',
      [pg_id]
    );

    res.json({ rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single room
const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, pg_id } = req.user;

    const [rooms] = await database.query(
      'SELECT r.*, p.pg_id as pg_uid FROM rooms r JOIN pgs p ON r.pg_id = p.id WHERE r.id = ?',
      [id]
    );

    if (rooms.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (role === 'pg_admin' && pg_id != rooms[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ room: rooms[0] });
  } catch (error) {
    console.error('Get room by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create room
const createRoom = async (req, res) => {
  try {
    const { pg_id, room_name, total_beds, rent_per_bed } = req.body;
    const { role, pg_id: userPgId } = req.user;

    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!pg_id || !room_name || !total_beds || !rent_per_bed) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check subscription limits
    const roomCheck = await canCreateRoom(pg_id);
    if (!roomCheck.allowed) {
      return res.status(403).json({ error: roomCheck.message });
    }

    const [result] = await database.query(
      'INSERT INTO rooms (pg_id, room_name, total_beds, rent_per_bed) VALUES (?, ?, ?, ?)',
      [pg_id, room_name, total_beds, rent_per_bed]
    );

    const roomId = result.insertId;

    // Check bed limits before creating beds
    const bedCheck = await canCreateBed(pg_id, roomId);
    
    if (!bedCheck.allowed) {
      // Delete the room if bed limit is exceeded
      await database.query('DELETE FROM rooms WHERE id = ?', [roomId]);
      return res.status(403).json({ error: bedCheck.message });
    }

    // Create beds for this room (up to remaining limit)
    const bedsToCreate = Math.min(total_beds, bedCheck.remaining);
    const bedInserts = [];
    for (let i = 1; i <= bedsToCreate; i++) {
      bedInserts.push([roomId, i]);
    }

    if (bedInserts.length > 0) {
      await database.query(
        'INSERT INTO beds (room_id, bed_number) VALUES ?',
        [bedInserts]
      );
    }

    // Update room total_beds if we couldn't create all beds
    if (bedsToCreate < total_beds) {
      await database.query(
        'UPDATE rooms SET total_beds = ? WHERE id = ?',
        [bedsToCreate, roomId]
      );
    }

    const [rooms] = await database.query('SELECT * FROM rooms WHERE id = ?', [roomId]);
    res.status(201).json({ message: 'Room created successfully', room: rooms[0] });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update room
const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { room_name, total_beds, rent_per_bed } = req.body;
    const { role, pg_id } = req.user;

    // Get current room
    const [rooms] = await database.query('SELECT * FROM rooms WHERE id = ?', [id]);
    if (rooms.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (role === 'pg_admin' && pg_id != rooms[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await database.query(
      'UPDATE rooms SET room_name = ?, total_beds = ?, rent_per_bed = ? WHERE id = ?',
      [room_name, total_beds, rent_per_bed, id]
    );

    // Handle bed count changes
    const currentBedCount = await database.query(
      'SELECT COUNT(*) as count FROM beds WHERE room_id = ?',
      [id]
    );
    const currentCount = currentBedCount[0][0].count;

    if (total_beds > currentCount) {
      // Add new beds
      const bedInserts = [];
      for (let i = currentCount + 1; i <= total_beds; i++) {
        bedInserts.push([id, i]);
      }
      await database.query('INSERT INTO beds (room_id, bed_number) VALUES ?', [bedInserts]);
    } else if (total_beds < currentCount) {
      // Remove extra beds (only if vacant)
      await database.query(
        'DELETE FROM beds WHERE room_id = ? AND bed_number > ? AND status = "vacant"',
        [id, total_beds]
      );
    }

    const [updatedRooms] = await database.query('SELECT * FROM rooms WHERE id = ?', [id]);
    res.json({ message: 'Room updated successfully', room: updatedRooms[0] });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete room
const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, pg_id } = req.user;

    const [rooms] = await database.query('SELECT * FROM rooms WHERE id = ?', [id]);
    if (rooms.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (role === 'pg_admin' && pg_id != rooms[0].pg_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await database.query('DELETE FROM rooms WHERE id = ?', [id]);
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
};

