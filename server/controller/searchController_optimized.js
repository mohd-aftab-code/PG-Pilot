const database = require('../config/database');

/**
 * Search PGs with filters - OPTIMIZED VERSION
 * GET /api/search/pgs
 */
const searchPGs = async (req, res) => {
  try {
    const {
      city,
      area,
      budget_min,
      budget_max,
      gender,
      has_food,
      has_wifi,
      has_ac,
      page = 1,
      limit = 10
    } = req.query;

    // Validate required params
    if (!city) {
      return res.status(400).json({
        success: false,
        error: 'city parameter is required'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const cityTrimmed = city.trim().toLowerCase();

    // Step 1: Get PGs with active subscriptions in the city (optimized query)
    let pgQuery = `
      SELECT DISTINCT p.id AS pg_id
      FROM pgs p
      INNER JOIN pg_subscriptions ps ON p.id = ps.pg_id
      WHERE ps.expiry_date >= CURDATE()
        AND p.city IS NOT NULL
        AND LOWER(TRIM(p.city)) = ?
    `;

    const pgParams = [cityTrimmed];

    // Area filter (case-insensitive substring match)
    if (area && area.trim()) {
      const areaTrimmed = area.trim().toLowerCase();
      pgQuery += ' AND (LOWER(TRIM(p.area)) LIKE ? OR LOWER(p.address) LIKE ?)';
      pgParams.push(`%${areaTrimmed}%`, `%${areaTrimmed}%`);
    }

    // Execute query to get matching PG IDs
    const [pgIdRows] = await database.query(pgQuery, pgParams);
    let pgIds = pgIdRows.map(row => row.pg_id);

    if (pgIds.length === 0) {
      return res.json({
        success: true,
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        data: []
      });
    }

    // Step 2: Get rooms with available beds for these PGs
    let roomsQuery = `
      SELECT DISTINCT r.pg_id
      FROM rooms r
      INNER JOIN beds b ON r.id = b.room_id
      WHERE r.pg_id IN (${pgIds.map(() => '?').join(',')})
        AND r.show_in_marketplace = 1
        AND b.status = 'vacant'
    `;

    const roomsParams = [...pgIds];

    // Gender filter
    if (gender && ['male', 'female', 'unisex'].includes(gender.toLowerCase())) {
      roomsQuery += ' AND (r.gender_type = ? OR r.gender_type = "unisex")';
      roomsParams.push(gender.toLowerCase());
    }

    // Budget filter
    if (budget_min) {
      roomsQuery += ' AND r.rent_per_bed >= ?';
      roomsParams.push(parseInt(budget_min));
    }
    if (budget_max) {
      roomsQuery += ' AND r.rent_per_bed <= ?';
      roomsParams.push(parseInt(budget_max));
    }

    roomsQuery += ' GROUP BY r.pg_id, r.id HAVING COUNT(b.id) > 0';

    const [roomPgRows] = await database.query(roomsQuery, roomsParams);
    pgIds = [...new Set(roomPgRows.map(row => row.pg_id))];

    if (pgIds.length === 0) {
      return res.json({
        success: true,
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        data: []
      });
    }

    // Step 3: Get PG details for matching PGs
    const pgDetailsQuery = `
      SELECT 
        p.id AS pg_id,
        p.name AS pg_name,
        p.address,
        p.city,
        p.area,
        p.latitude,
        p.longitude,
        p.pincode
      FROM pgs p
      WHERE p.id IN (${pgIds.map(() => '?').join(',')})
    `;
    const [pgRows] = await database.query(pgDetailsQuery, pgIds);
    pgIds = pgRows.map(row => row.pg_id);

    // Step 4: Get facilities for all PGs (single query)
    const facilitiesMap = {};
    if (pgIds.length > 0) {
      const [facilitiesRows] = await database.query(
        `SELECT pg_id, facility_type FROM pg_facilities 
         WHERE pg_id IN (${pgIds.map(() => '?').join(',')})`,
        pgIds
      );
      
      facilitiesRows.forEach(row => {
        if (!facilitiesMap[row.pg_id]) {
          facilitiesMap[row.pg_id] = [];
        }
        facilitiesMap[row.pg_id].push(row.facility_type);
      });
    }

    // Step 5: Filter by facilities if specified
    const filteredPgIds = [];
    for (const pgId of pgIds) {
      const facilities = facilitiesMap[pgId] || [];
      let include = true;

      if (has_food === 'true' && !facilities.includes('FOOD')) {
        include = false;
      }
      if (has_wifi === 'true' && !facilities.includes('WIFI')) {
        include = false;
      }
      if (has_ac === 'true' && !facilities.includes('AC')) {
        include = false;
      }

      if (include) {
        filteredPgIds.push(pgId);
      }
    }

    if (filteredPgIds.length === 0) {
      return res.json({
        success: true,
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        data: []
      });
    }

    // Step 6: Get rooms for filtered PGs (optimized query)
    let roomDetailsQuery = `
      SELECT
        r.id AS room_id,
        r.pg_id,
        r.room_name,
        r.rent_per_bed,
        r.gender_type,
        r.room_description,
        r.room_images,
        COUNT(b.id) AS total_beds,
        SUM(CASE WHEN b.status = 'vacant' THEN 1 ELSE 0 END) AS available_beds
      FROM rooms r
      LEFT JOIN beds b ON r.id = b.room_id
      WHERE r.pg_id IN (${filteredPgIds.map(() => '?').join(',')})
        AND r.show_in_marketplace = 1
    `;

    const roomDetailsParams = [...filteredPgIds];

    // Apply gender filter again for rooms
    if (gender && ['male', 'female', 'unisex'].includes(gender.toLowerCase())) {
      roomDetailsQuery += ' AND (r.gender_type = ? OR r.gender_type = "unisex")';
      roomDetailsParams.push(gender.toLowerCase());
    }

    // Apply budget filter again for rooms
    if (budget_min) {
      roomDetailsQuery += ' AND r.rent_per_bed >= ?';
      roomDetailsParams.push(parseInt(budget_min));
    }
    if (budget_max) {
      roomDetailsQuery += ' AND r.rent_per_bed <= ?';
      roomDetailsParams.push(parseInt(budget_max));
    }

    roomDetailsQuery += ' GROUP BY r.id HAVING available_beds > 0';

    const [roomRows] = await database.query(roomDetailsQuery, roomDetailsParams);

    // Step 7: Group rooms by PG
    const roomsByPg = {};
    roomRows.forEach(room => {
      if (!roomsByPg[room.pg_id]) {
        roomsByPg[room.pg_id] = [];
      }
      roomsByPg[room.pg_id].push({
        room_id: room.room_id,
        room_name: room.room_name,
        rent_per_bed: parseFloat(room.rent_per_bed),
        gender_type: room.gender_type,
        available_beds: parseInt(room.available_beds),
        room_description: room.room_description || null,
        room_images: room.room_images ? (typeof room.room_images === 'string' ? JSON.parse(room.room_images) : room.room_images) : null
      });
    });

    // Step 8: Build final response
    const result = [];
    for (const pgRow of pgRows) {
      if (filteredPgIds.includes(pgRow.pg_id) && roomsByPg[pgRow.pg_id]) {
        result.push({
          pg_id: pgRow.pg_id,
          pg_name: pgRow.pg_name,
          address: pgRow.address,
          city: pgRow.city,
          area: pgRow.area,
          latitude: pgRow.latitude ? parseFloat(pgRow.latitude) : null,
          longitude: pgRow.longitude ? parseFloat(pgRow.longitude) : null,
          pincode: pgRow.pincode,
          facilities: facilitiesMap[pgRow.pg_id] || [],
          rooms: roomsByPg[pgRow.pg_id] || []
        });
      }
    }

    // Step 9: Apply pagination
    const total = result.length;
    const paginatedResult = result.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total: total,
      data: paginatedResult
    });
  } catch (error) {
    console.error('Search PGs error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

module.exports = {
  searchPGs
};

