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
      facilities,
      referral_code: incomingReferralCode // Referral code used during registration
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
    // Also include user_id if user is pg_admin for bidirectional relationship
    const tempPgUid = `TEMP_${Date.now()}`;
    const imagesJson = imagePaths.length > 0 ? JSON.stringify(imagePaths) : null;
    
    const [result] = await database.query(
      `INSERT INTO pgs (pg_uid, name, address, city, area, pincode, food_enabled, default_due_day, images, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tempPgUid,
        name, 
        address || null, 
        city || null, 
        area || null, 
        pincode || null, 
        food_enabled || 0, 
        default_due_day || 5,
        imagesJson,
        role === 'pg_admin' ? userId : null // Store user_id in pgs table
      ]
    );

    const pgId = result.insertId;
    
    // Generate and update pg_uid with proper format
    const pgUid = `PG_ID_${String(pgId).padStart(3, '0')}`;
    
    // Generate unique referral code (REF + 6 digit number)
    const referralCode = `REF${String(pgId).padStart(6, '0')}`;
    
    // Auto-start 30-day FREE TRIAL when PG is registered
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30); // 30 days from today
    
    // Update PG with pg_uid, referral_code, and trial dates
    // Also ensure user_id is set (in case it wasn't set during INSERT)
    const [updatePgResult] = await database.query(
      `UPDATE pgs 
       SET pg_uid = ?, 
           referral_code = ?,
           trial_start_date = ?, 
           trial_end_date = ?, 
           subscription_status = 'TRIAL',
           user_id = COALESCE(user_id, ?)
       WHERE id = ?`,
      [pgUid, referralCode, trialStartDate.toISOString().split('T')[0], trialEndDate.toISOString().split('T')[0], role === 'pg_admin' ? userId : null, pgId]
    );
    
    console.log(`PG Controller: Updated PG ${pgId} with pg_uid ${pgUid}, referral_code ${referralCode}, trial dates, and user_id ${role === 'pg_admin' ? userId : 'null'}`, {
      affectedRows: updatePgResult.affectedRows,
      user_id: role === 'pg_admin' ? userId : null,
      referral_code: referralCode
    });

    // If user is pg_admin, assign the PG to them
    // IMPORTANT: Do this AFTER the PG is fully created and updated
    if (role === 'pg_admin') {
      try {
        // Verify PG exists before updating user
        const [pgCheck] = await database.query('SELECT id, name FROM pgs WHERE id = ?', [pgId]);
        if (pgCheck.length === 0) {
          throw new Error(`PG ${pgId} does not exist after creation`);
        }
        
        console.log(`PG Controller: Verifying PG exists before user update:`, {
          pgId: pgId,
          pgName: pgCheck[0].name,
          userId: userId
        });
        
        // Get current user state before update
        const [userBefore] = await database.query('SELECT id, pg_id, name FROM users WHERE id = ?', [userId]);
        console.log(`PG Controller: User state BEFORE update:`, userBefore[0]);
        
        // Update user's pg_id with the PG's ID (from pgs table)
        const [updateResult] = await database.query(
          'UPDATE users SET pg_id = ? WHERE id = ?',
          [pgId, userId]
        );
        
        console.log(`PG Controller: UPDATE query executed:`, {
          query: 'UPDATE users SET pg_id = ? WHERE id = ?',
          params: [pgId, userId],
          affectedRows: updateResult.affectedRows,
          changedRows: updateResult.changedRows,
          insertId: updateResult.insertId,
          warningCount: updateResult.warningCount
        });
        
        // Verify the update was successful
        if (updateResult.affectedRows === 0) {
          console.error(`PG Controller: CRITICAL ERROR - Failed to update pg_id for user ${userId}. No rows affected.`);
          // Try to get user info for debugging
          const [userCheck] = await database.query('SELECT id, pg_id, name FROM users WHERE id = ?', [userId]);
          console.error('PG Controller: User state after failed update:', userCheck[0]);
          
          // Try one more time with explicit check
          console.log('PG Controller: Retrying user update...');
          const [retryResult] = await database.query(
            'UPDATE users SET pg_id = ? WHERE id = ?',
            [pgId, userId]
          );
          console.log('PG Controller: Retry result:', {
            affectedRows: retryResult.affectedRows,
            changedRows: retryResult.changedRows
          });
        } else {
          // Verify the update by reading back
          const [verifyUser] = await database.query('SELECT id, pg_id, name FROM users WHERE id = ?', [userId]);
          console.log('PG Controller: User state AFTER successful update:', verifyUser[0]);
          
          // Double-check: pg_id should match pgId
          if (verifyUser[0].pg_id != pgId) {
            console.error(`PG Controller: MISMATCH ERROR - User pg_id (${verifyUser[0].pg_id}) does not match PG id (${pgId})`);
          } else {
            console.log(`PG Controller: ✅ SUCCESS - User ${userId} successfully assigned to PG ${pgId}`);
          }
        }
      } catch (updateError) {
        console.error('PG Controller: ERROR updating user pg_id:', updateError);
        console.error('PG Controller: Error details:', {
          message: updateError.message,
          code: updateError.code,
          sqlState: updateError.sqlState,
          sqlMessage: updateError.sqlMessage,
          stack: updateError.stack
        });
        // Don't fail the entire request, but log the error
        // The PG is created, but user assignment failed
      }
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

    // Handle referral code if provided
    if (incomingReferralCode) {
      try {
        // Find the PG that owns this referral code
        const [referringPGs] = await database.query(
          'SELECT id, name FROM pgs WHERE referral_code = ?',
          [incomingReferralCode]
        );
        
        if (referringPGs.length > 0 && referringPGs[0].id !== pgId) {
          const referringPgId = referringPGs[0].id;
          
          // Check if referral already exists
          const [existingReferral] = await database.query(
            'SELECT id FROM referrals WHERE referred_by = ? AND referred_pg = ?',
            [referringPgId, pgId]
          );
          
          if (existingReferral.length === 0) {
            // Auto-create referral record (status: pending) - 1 month (30 days) reward
            await database.query(
              'INSERT INTO referrals (referred_by, referred_pg, referral_code, reward_days, status) VALUES (?, ?, ?, ?, ?)',
              [referringPgId, pgId, incomingReferralCode, 30, 'pending']
            );
            console.log(`PG Controller: Auto-created referral - PG ${referringPgId} referred PG ${pgId} using code ${incomingReferralCode}`);
          }
        } else {
          console.log(`PG Controller: Invalid or self-referral code: ${incomingReferralCode}`);
        }
      } catch (referralError) {
        console.error('PG Controller: Error processing referral code:', referralError);
        // Don't fail PG creation if referral processing fails
      }
    }

    // Fetch the created PG (with auto-generated pg_uid)
    const [pgs] = await database.query('SELECT * FROM pgs WHERE id = ?', [pgId]);

    // If user is pg_admin, also return updated user info with pg_id
    let updatedUser = null;
    if (role === 'pg_admin') {
      try {
        const [users] = await database.query(
          'SELECT id, pg_id, name, email, phone, role FROM users WHERE id = ?',
          [userId]
        );
        if (users.length > 0) {
          updatedUser = users[0];
          console.log('PG Controller: Returning updated user info:', updatedUser);
        }
      } catch (userError) {
        console.error('PG Controller: Error fetching updated user:', userError);
      }
    }

    res.status(201).json({ 
      message: 'PG created successfully', 
      pg: pgs[0],
      user_updated: role === 'pg_admin',
      user: updatedUser // Include updated user with pg_id
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

