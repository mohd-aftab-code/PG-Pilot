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

    // Validate and fix budget range
    let budgetMin = budget_min ? parseInt(budget_min) : null;
    let budgetMax = budget_max ? parseInt(budget_max) : null;
    
    if (budgetMin && budgetMax && budgetMin > budgetMax) {
      // Swap if min > max (user entered backwards)
      console.log(`Budget range swapped: min was ${budgetMin}, max was ${budgetMax}`);
      [budgetMin, budgetMax] = [budgetMax, budgetMin];
    }

    // Step 1: Get PGs with active subscriptions in the city (optimized query)
    // Use LIKE for flexible matching (same as suggestions)
    let pgQuery = `
      SELECT DISTINCT p.id AS pg_id
      FROM pgs p
      INNER JOIN pg_subscriptions ps ON p.id = ps.pg_id
      WHERE ps.expiry_date >= CURDATE()
        AND p.city IS NOT NULL
        AND (LOWER(TRIM(p.city)) LIKE ? OR LOWER(p.address) LIKE ?)
    `;

    const pgParams = [`%${cityTrimmed}%`, `%${cityTrimmed}%`];

    // Area filter (case-insensitive substring match)
    if (area && area.trim()) {
      const areaTrimmed = area.trim().toLowerCase();
      pgQuery += ' AND (LOWER(TRIM(p.area)) LIKE ? OR LOWER(p.address) LIKE ?)';
      pgParams.push(`%${areaTrimmed}%`, `%${areaTrimmed}%`);
    }

    // Execute query to get matching PG IDs
    console.log('Search Query:', pgQuery);
    console.log('Search Params:', pgParams);
    const [pgIdRows] = await database.query(pgQuery, pgParams);
    console.log('Found PG IDs:', pgIdRows.map(row => row.pg_id));
    let pgIds = pgIdRows.map(row => row.pg_id);

    // Debug: If no PGs found, check why
    if (pgIds.length === 0) {
      console.log('=== DEBUGGING: No PGs found ===');
      console.log('City searched:', cityTrimmed);
      console.log('Area searched:', area ? area.trim().toLowerCase() : 'none');
      
      // Check 1: Are there any PGs with this city?
      const [cityCheck] = await database.query(
        `SELECT id, name, city, area FROM pgs 
         WHERE (LOWER(TRIM(city)) LIKE ? OR LOWER(address) LIKE ?) 
         LIMIT 5`,
        [`%${cityTrimmed}%`, `%${cityTrimmed}%`]
      );
      console.log('PGs with matching city (without subscription filter):', cityCheck.length);
      if (cityCheck.length > 0) {
        console.log('Sample PGs:', cityCheck.map(p => ({ id: p.id, name: p.name, city: p.city, area: p.area })));
        
        // Check 2: Do these PGs have active subscriptions?
        const cityPgIds = cityCheck.map(p => p.id);
        const [subCheck] = await database.query(
          `SELECT ps.pg_id, ps.expiry_date, CURDATE() as today,
                  CASE WHEN ps.expiry_date >= CURDATE() THEN 'ACTIVE' ELSE 'EXPIRED' END as status
           FROM pg_subscriptions ps
           WHERE ps.pg_id IN (${cityPgIds.map(() => '?').join(',')})`,
          cityPgIds
        );
        console.log('Subscriptions for these PGs:', subCheck);
        
        if (subCheck.length === 0) {
          console.log('⚠️ ISSUE: These PGs have NO subscriptions!');
        } else {
          const activeSubs = subCheck.filter(s => s.status === 'ACTIVE');
          console.log(`Active subscriptions: ${activeSubs.length} out of ${subCheck.length}`);
          if (activeSubs.length === 0) {
            console.log('⚠️ ISSUE: All subscriptions are EXPIRED!');
          }
        }
      } else {
        console.log('⚠️ ISSUE: No PGs found with this city name in database!');
      }
      
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

    // Budget filter (use validated budgetMin and budgetMax)
    if (budgetMin) {
      roomsQuery += ' AND r.rent_per_bed >= ?';
      roomsParams.push(budgetMin);
    }
    if (budgetMax) {
      roomsQuery += ' AND r.rent_per_bed <= ?';
      roomsParams.push(budgetMax);
    }

    roomsQuery += ' GROUP BY r.pg_id, r.id HAVING COUNT(b.id) > 0';

    console.log('Rooms Query:', roomsQuery);
    console.log('Rooms Params:', roomsParams);
    const [roomPgRows] = await database.query(roomsQuery, roomsParams);
    console.log('PGs with available rooms:', roomPgRows.map(row => row.pg_id));
    
    // IMPORTANT: Don't filter PGs here - show all PGs that match city/area/subscription
    // Even if they have no vacant beds, they should still appear in search
    // The rooms will just be empty array
    if (roomPgRows.length > 0) {
      // If we have PGs with vacant beds, we can optionally prioritize them
      // But for now, keep all matching PGs
      const pgsWithVacantBeds = [...new Set(roomPgRows.map(row => row.pg_id))];
      console.log('PGs with vacant beds:', pgsWithVacantBeds);
      // Keep all original pgIds - don't filter
    } else {
      console.log('No PGs found with vacant beds, but continuing with all matching PGs');
    }
    // Don't filter pgIds - show all PGs that match city/area/subscription criteria

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
        p.pincode,
        p.images
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
    // IMPORTANT: Only filter if user explicitly requested facilities
    // If PG has no facilities data, still include it (facilities will be empty array)
    const filteredPgIds = [];
    const hasFacilityFilters = has_food === 'true' || has_wifi === 'true' || has_ac === 'true';
    
    console.log('Facilities filter check:');
    console.log('has_food:', has_food, 'has_wifi:', has_wifi, 'has_ac:', has_ac);
    console.log('Has facility filters:', hasFacilityFilters);
    console.log('Facilities map:', facilitiesMap);
    
    if (!hasFacilityFilters) {
      // No facility filters - include all PGs (even if they have no facilities data)
      filteredPgIds.push(...pgIds);
      console.log('No facility filters - including all PGs:', filteredPgIds);
    } else {
      // Facility filters are specified
      // IMPORTANT: If PG has no facilities data (empty array), still include it
      // Only filter out PGs that have facilities data but don't match the filter
      for (const pgId of pgIds) {
        const facilities = facilitiesMap[pgId] || [];
        
        // If PG has no facilities data at all, include it (treat as "facilities unknown")
        if (facilities.length === 0) {
          filteredPgIds.push(pgId);
          console.log(`PG ${pgId}: INCLUDED - No facilities data (treating as unknown)`);
          continue;
        }
        
        // PG has facilities data - check if it matches the filters
        let include = true;
        const reasons = [];

        if (has_food === 'true' && !facilities.includes('FOOD')) {
          include = false;
          reasons.push('missing FOOD');
        }
        if (has_wifi === 'true' && !facilities.includes('WIFI')) {
          include = false;
          reasons.push('missing WIFI');
        }
        if (has_ac === 'true' && !facilities.includes('AC')) {
          include = false;
          reasons.push('missing AC');
        }

        if (include) {
          filteredPgIds.push(pgId);
          console.log(`PG ${pgId}: INCLUDED - Facilities: [${facilities.join(', ')}]`);
        } else {
          console.log(`PG ${pgId}: FILTERED OUT - Facilities: [${facilities.join(', ')}], Reasons: ${reasons.join(', ')}`);
        }
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

    // Apply budget filter again for rooms (use validated budgetMin and budgetMax)
    if (budgetMin) {
      roomDetailsQuery += ' AND r.rent_per_bed >= ?';
      roomDetailsParams.push(budgetMin);
    }
    if (budgetMax) {
      roomDetailsQuery += ' AND r.rent_per_bed <= ?';
      roomDetailsParams.push(budgetMax);
    }

    roomDetailsQuery += ' GROUP BY r.id HAVING available_beds > 0';

    console.log('Room Details Query:', roomDetailsQuery);
    console.log('Room Details Params:', roomDetailsParams);
    const [roomRows] = await database.query(roomDetailsQuery, roomDetailsParams);
    console.log('Room rows found:', roomRows.length);
    console.log('Room rows:', roomRows.map(r => ({ pg_id: r.pg_id, room_id: r.room_id, available_beds: r.available_beds })));

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
    console.log('Building final result. Filtered PG IDs:', filteredPgIds);
    console.log('PG Rows count:', pgRows.length);
    console.log('Rooms by PG keys:', Object.keys(roomsByPg));
    
    for (const pgRow of pgRows) {
      if (filteredPgIds.includes(pgRow.pg_id)) {
        // Include PG even if no rooms found (might have rooms but no vacant beds)
        const pgRooms = roomsByPg[pgRow.pg_id] || [];
        console.log(`PG ${pgRow.pg_id} (${pgRow.pg_name}): ${pgRooms.length} rooms`);
        
        result.push({
          pg_id: pgRow.pg_id,
          pg_name: pgRow.pg_name,
          address: pgRow.address,
          city: pgRow.city,
          area: pgRow.area,
          pincode: pgRow.pincode,
          images: pgRow.images ? (typeof pgRow.images === 'string' ? JSON.parse(pgRow.images) : pgRow.images) : null,
          facilities: facilitiesMap[pgRow.pg_id] || [],
          rooms: pgRooms
        });
      } else {
        console.log(`PG ${pgRow.pg_id} (${pgRow.pg_name}) filtered out - not in filteredPgIds`);
      }
    }

    // Step 9: Apply pagination
    const total = result.length;
    const paginatedResult = result.slice(offset, offset + parseInt(limit));

    console.log('Final result count:', total);
    console.log('Paginated result count:', paginatedResult.length);

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

/**
 * Get search suggestions/autocomplete
 * GET /api/search/suggestions?q=keyword
 */
const getSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    
    console.log('=== SUGGESTIONS REQUEST ===');
    console.log('Query:', q);
    
    if (!q || q.trim().length < 2) {
      console.log('Query too short, returning empty');
      return res.json({
        success: true,
        suggestions: {
          cities: [],
          areas: []
        }
      });
    }

    const searchTerm = `%${q.trim().toLowerCase()}%`;
    console.log('Search term:', searchTerm);

    // Get city suggestions (from active subscription PGs only)
    const [cities] = await database.query(`
      SELECT DISTINCT p.city 
      FROM pgs p
      INNER JOIN pg_subscriptions ps ON p.id = ps.pg_id
      WHERE p.city IS NOT NULL 
        AND ps.expiry_date >= CURDATE()
        AND (LOWER(TRIM(p.city)) LIKE ? OR LOWER(p.address) LIKE ?)
      ORDER BY p.city
      LIMIT 10
    `, [searchTerm, searchTerm]);

    console.log('City suggestions found:', cities.length);
    console.log('City suggestions:', cities.map(c => c.city));

    // Get area suggestions (from active subscription PGs only)
    const [areas] = await database.query(`
      SELECT DISTINCT p.area 
      FROM pgs p
      INNER JOIN pg_subscriptions ps ON p.id = ps.pg_id
      WHERE p.area IS NOT NULL 
        AND ps.expiry_date >= CURDATE()
        AND (LOWER(TRIM(p.area)) LIKE ? OR LOWER(p.address) LIKE ?)
      ORDER BY p.area
      LIMIT 10
    `, [searchTerm, searchTerm]);

    console.log('Area suggestions found:', areas.length);
    console.log('Area suggestions:', areas.map(a => a.area));

    // Debug: Check if there are any PGs with this city/area (without subscription filter)
    if (cities.length === 0 && areas.length === 0) {
      console.log('No suggestions found. Checking without subscription filter...');
      const [allCities] = await database.query(`
        SELECT DISTINCT p.city 
        FROM pgs p
        WHERE p.city IS NOT NULL 
          AND (LOWER(TRIM(p.city)) LIKE ? OR LOWER(p.address) LIKE ?)
        ORDER BY p.city
        LIMIT 10
      `, [searchTerm, searchTerm]);
      
      console.log('Cities without subscription filter:', allCities.length);
      if (allCities.length > 0) {
        console.log('⚠️ ISSUE: Cities exist but no active subscriptions!');
        console.log('Sample cities:', allCities.map(c => c.city));
      }
    }

    const cityList = [...new Set(cities.map(row => row.city).filter(c => c))];
    const areaList = [...new Set(areas.map(row => row.area).filter(a => a))];

    console.log('Final city list:', cityList);
    console.log('Final area list:', areaList);

    res.json({
      success: true,
      suggestions: {
        cities: cityList,
        areas: areaList
      }
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

module.exports = {
  searchPGs,
  getSuggestions
};

