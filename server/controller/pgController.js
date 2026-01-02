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

    // Get facilities for this PG
    const [facilitiesRows] = await database.query(
      'SELECT facility_type FROM pg_facilities WHERE pg_id = ?',
      [id]
    );
    const facilities = facilitiesRows.map(row => row.facility_type);

    const pg = pgs[0];
    pg.facilities = facilities;

    res.json({ pg });
  } catch (error) {
    console.error('Get PG by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create PG (Superadmin can create any PG, pg_admin can create their own)
const createPG = async (req, res) => {
  try {
    const { 
      name, 
      address, 
      city, 
      area, 
      pincode, 
      food_enabled, 
      default_due_day,
      facilities
    } = req.body;
    const { role, id: userId, pg_id: userPgId } = req.user;

    if (!name) {
      return res.status(400).json({ error: 'PG name is required' });
    }

    // If user is pg_admin and already has a PG, don't allow creating another
    if (role === 'pg_admin' && userPgId) {
      return res.status(403).json({ error: 'You already have a PG assigned. Please contact support to create another.' });
    }

    // Handle uploaded images
    const imagePaths = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        imagePaths.push(`/uploads/pg-images/${file.filename}`);
      });
    }

    // Insert PG first with temporary pg_uid (will be updated after getting insertId)
    const tempPgUid = `TEMP_${Date.now()}`;
    const imagesJson = imagePaths.length > 0 ? JSON.stringify(imagePaths) : null;
    
    const [result] = await database.query(
      `INSERT INTO pgs (pg_uid, name, address, city, area, pincode, food_enabled, default_due_day, images) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tempPgUid,
        name, 
        address || null, 
        city || null, 
        area || null, 
        pincode || null, 
        food_enabled || 0, 
        default_due_day || 5,
        imagesJson
      ]
    );

    const pgId = result.insertId;
    
    // Generate and update pg_uid with proper format
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

    // Save facilities to pg_facilities table
    // Handle facilities array from FormData (can be string or array)
    let facilitiesArray = [];
    if (facilities) {
      if (Array.isArray(facilities)) {
        facilitiesArray = facilities;
      } else if (typeof facilities === 'string') {
        facilitiesArray = [facilities];
      }
    }
    if (facilitiesArray.length > 0) {
      const facilityLabels = {
        'FOOD': 'Food Available',
        'WIFI': 'WiFi',
        'AC': 'AC Rooms',
        'PARKING': 'Parking',
        'LAUNDRY': 'Laundry Service',
        'SECURITY': 'Security',
        'CCTV': 'CCTV',
        'GYM': 'Gym',
        'STUDY_ROOM': 'Study Room'
      };
      
      for (const facility of facilities) {
        try {
          await database.query(
            `INSERT INTO pg_facilities (pg_id, facility_type, label) 
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE label = VALUES(label)`,
            [pgId, facility, facilityLabels[facility] || facility]
          );
        } catch (facilityError) {
          console.error(`Error inserting facility ${facility}:`, facilityError);
        }
      }
    }

    // Fetch the created PG (with auto-generated pg_uid)
    const [pgs] = await database.query('SELECT * FROM pgs WHERE id = ?', [pgId]);

    res.status(201).json({ 
      message: 'PG created successfully', 
      pg: pgs[0],
      user_updated: role === 'pg_admin'
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
    const { 
      name, 
      address, 
      city, 
      area, 
      pincode, 
      food_enabled, 
      default_due_day,
      facilities
    } = req.body;

    if (role === 'pg_admin' && pg_id != id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Handle uploaded images
    let imagesJson = null;
    if (req.files && req.files.length > 0) {
      const imagePaths = [];
      req.files.forEach(file => {
        imagePaths.push(`/uploads/pg-images/${file.filename}`);
      });
      imagesJson = JSON.stringify(imagePaths);
    }

    // If new images uploaded, update images field
    if (imagesJson) {
      await database.query(
        `UPDATE pgs SET name = ?, address = ?, city = ?, area = ?, pincode = ?, 
         food_enabled = ?, default_due_day = ?, images = ? 
         WHERE id = ?`,
        [
          name, 
          address, 
          city || null, 
          area || null, 
          pincode || null, 
          food_enabled, 
          default_due_day,
          imagesJson,
          id
        ]
      );
    } else {
      // Update without changing images
      await database.query(
        `UPDATE pgs SET name = ?, address = ?, city = ?, area = ?, pincode = ?, 
         food_enabled = ?, default_due_day = ? 
         WHERE id = ?`,
        [
          name, 
          address, 
          city || null, 
          area || null, 
          pincode || null, 
          food_enabled, 
          default_due_day, 
          id
        ]
      );
    }

    // Update facilities - first delete existing, then insert new ones
    await database.query('DELETE FROM pg_facilities WHERE pg_id = ?', [id]);
    
    // Handle facilities array from FormData
    let facilitiesArray = [];
    if (req.body.facilities) {
      if (Array.isArray(req.body.facilities)) {
        facilitiesArray = req.body.facilities;
      } else if (typeof req.body.facilities === 'string') {
        facilitiesArray = [req.body.facilities];
      }
    }
    
    if (facilitiesArray.length > 0) {
      const facilityLabels = {
        'FOOD': 'Food Available',
        'WIFI': 'WiFi',
        'AC': 'AC Rooms',
        'PARKING': 'Parking',
        'LAUNDRY': 'Laundry Service',
        'SECURITY': 'Security',
        'CCTV': 'CCTV',
        'GYM': 'Gym',
        'STUDY_ROOM': 'Study Room'
      };
      
      for (const facility of facilitiesArray) {
        try {
          await database.query(
            `INSERT INTO pg_facilities (pg_id, facility_type, label) 
             VALUES (?, ?, ?)`,
            [id, facility, facilityLabels[facility] || facility]
          );
        } catch (facilityError) {
          console.error(`Error inserting facility ${facility}:`, facilityError);
        }
      }
    }

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

/**
 * Get PG detail for marketplace (public endpoint)
 * GET /api/pg/:pg_id
 */
const getPGDetail = async (req, res) => {
  try {
    const { pg_id } = req.params;

    // Get PG basic info
    const [pgs] = await database.query('SELECT * FROM pgs WHERE id = ?', [pg_id]);
    if (pgs.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PG not found'
      });
    }

    const pg = pgs[0];

    // Check if PG has active subscription
    const [subscriptions] = await database.query(
      `SELECT * FROM pg_subscriptions 
       WHERE pg_id = ? AND expiry_date >= CURDATE()
       ORDER BY expiry_date DESC LIMIT 1`,
      [pg_id]
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PG does not have an active subscription'
      });
    }

    // Get facilities
    const [facilitiesRows] = await database.query(
      'SELECT facility_type FROM pg_facilities WHERE pg_id = ? ORDER BY facility_type',
      [pg_id]
    );
    const facilities = facilitiesRows.map(row => row.facility_type);

    // Get all rooms with available beds
    const [rooms] = await database.query(
      `SELECT
        r.id AS room_id,
        r.room_name,
        r.rent_per_bed,
        r.gender_type,
        r.room_description,
        r.room_images,
        r.show_in_marketplace,
        COUNT(b.id) AS total_beds,
        SUM(CASE WHEN b.status = 'vacant' THEN 1 ELSE 0 END) AS available_beds
      FROM rooms r
      LEFT JOIN beds b ON r.id = b.room_id
      WHERE r.pg_id = ?
      GROUP BY r.id
      ORDER BY r.room_name`,
      [pg_id]
    );

    // Format rooms data
    const roomsData = rooms.map(room => ({
      room_id: room.room_id,
      room_name: room.room_name,
      rent_per_bed: parseFloat(room.rent_per_bed),
      gender_type: room.gender_type,
      available_beds: parseInt(room.available_beds),
      total_beds: parseInt(room.total_beds),
      room_description: room.room_description || null,
      room_images: room.room_images ? JSON.parse(room.room_images) : null,
      show_in_marketplace: Boolean(room.show_in_marketplace)
    }));

    // Increment profile views
    const today = new Date().toISOString().split('T')[0];
    const [metricsRows] = await database.query(
      'SELECT * FROM pg_lead_metrics WHERE pg_id = ? AND metric_date = ?',
      [pg_id, today]
    );
    
    if (metricsRows.length === 0) {
      await database.query(
        'INSERT INTO pg_lead_metrics (pg_id, metric_date, profile_views) VALUES (?, ?, 1)',
        [pg_id, today]
      );
    } else {
      await database.query(
        'UPDATE pg_lead_metrics SET profile_views = profile_views + 1 WHERE pg_id = ? AND metric_date = ?',
        [pg_id, today]
      );
    }

    res.json({
      success: true,
      data: {
        pg_id: pg.id,
        pg_name: pg.name,
        address: pg.address,
        city: pg.city,
        area: pg.area,
        pincode: pg.pincode,
        latitude: pg.latitude ? parseFloat(pg.latitude) : null,
        longitude: pg.longitude ? parseFloat(pg.longitude) : null,
        food_enabled: Boolean(pg.food_enabled),
        facilities: facilities,
        rooms: roomsData
      }
    });
  } catch (error) {
    console.error('Get PG detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get PG analytics/lead metrics
 * GET /api/pg/:pg_id/analytics
 */
const getPGAnalytics = async (req, res) => {
  try {
    const { pg_id } = req.params;
    const { role, pg_id: userPgId } = req.user || {};

    // Authorization check
    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get today's metrics
    const todayDate = new Date().toISOString().split('T')[0];
    const [todayMetrics] = await database.query(
      'SELECT * FROM pg_lead_metrics WHERE pg_id = ? AND metric_date = ?',
      [pg_id, todayDate]
    );
    const today = todayMetrics[0] || {
      pg_id,
      metric_date: todayDate,
      profile_views: 0,
      total_inquiries: 0,
      contacted_inquiries: 0,
      booked_inquiries: 0
    };

    // Get last 30 days summary
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const [summaryRows] = await database.query(
      `SELECT 
         SUM(profile_views) AS total_views,
         SUM(total_inquiries) AS total_inquiries,
         SUM(contacted_inquiries) AS total_contacted,
         SUM(booked_inquiries) AS total_booked
       FROM pg_lead_metrics 
       WHERE pg_id = ? AND metric_date >= ?`,
      [pg_id, startDate.toISOString().split('T')[0]]
    );
    const summary = summaryRows[0] || {
      total_views: 0,
      total_inquiries: 0,
      total_contacted: 0,
      total_booked: 0
    };

    // Get last 7 days daily breakdown
    const endDate7 = new Date();
    const startDate7 = new Date();
    startDate7.setDate(startDate7.getDate() - 7);
    const [dailyMetrics] = await database.query(
      `SELECT * FROM pg_lead_metrics 
       WHERE pg_id = ? AND metric_date BETWEEN ? AND ?
       ORDER BY metric_date DESC`,
      [pg_id, startDate7.toISOString().split('T')[0], endDate7.toISOString().split('T')[0]]
    );

    res.json({
      success: true,
      data: {
        today,
        summary,
        daily_breakdown: dailyMetrics
      }
    });
  } catch (error) {
    console.error('Get PG analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getPGs,
  getPGById,
  createPG,
  updatePG,
  deletePG,
  getPGDetail,
  getPGAnalytics,
};

