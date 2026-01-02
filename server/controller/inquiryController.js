const database = require('../config/database');

/**
 * Create a new booking inquiry
 * POST /api/inquiry
 */
const createInquiry = async (req, res) => {
  try {
    const { tenant_user_id, pg_id, room_id } = req.body;

    // Validate required fields
    if (!tenant_user_id || !pg_id || !room_id) {
      return res.status(400).json({
        success: false,
        error: 'tenant_user_id, pg_id, and room_id are required'
      });
    }

    // Check if room exists and belongs to PG
    const [rooms] = await database.query(
      'SELECT * FROM rooms WHERE id = ? AND pg_id = ?',
      [room_id, pg_id]
    );

    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Room not found or does not belong to the specified PG'
      });
    }

    // Check available beds
    const [beds] = await database.query(
      `SELECT COUNT(*) AS count FROM beds 
       WHERE room_id = ? AND status = 'vacant'`,
      [room_id]
    );

    if (beds[0].count === 0) {
      return res.status(400).json({
        success: false,
        error: 'No available beds in this room'
      });
    }

    // Check if PG has active subscription
    const [subscriptions] = await database.query(
      `SELECT * FROM pg_subscriptions 
       WHERE pg_id = ? AND expiry_date >= CURDATE()
       ORDER BY expiry_date DESC LIMIT 1`,
      [pg_id]
    );

    if (subscriptions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'PG does not have an active subscription'
      });
    }

    // Check if inquiry already exists (not rejected or booked)
    const [existingInquiries] = await database.query(
      `SELECT id FROM booking_inquiries 
       WHERE tenant_user_id = ? AND pg_id = ? AND room_id = ? 
       AND status NOT IN ('REJECTED', 'BOOKED')`,
      [tenant_user_id, pg_id, room_id]
    );
    
    if (existingInquiries.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'An active inquiry already exists for this room'
      });
    }

    // Create inquiry
    const [inquiryResult] = await database.query(
      'INSERT INTO booking_inquiries (tenant_user_id, pg_id, room_id, status) VALUES (?, ?, ?, ?)',
      [tenant_user_id, pg_id, room_id, 'NEW']
    );
    const inquiryId = inquiryResult.insertId;

    // Increment metrics - get or create today's metrics
    const today = new Date().toISOString().split('T')[0];
    const [metricsRows] = await database.query(
      'SELECT * FROM pg_lead_metrics WHERE pg_id = ? AND metric_date = ?',
      [pg_id, today]
    );
    
    if (metricsRows.length === 0) {
      await database.query(
        'INSERT INTO pg_lead_metrics (pg_id, metric_date, total_inquiries) VALUES (?, ?, 1)',
        [pg_id, today]
      );
    } else {
      await database.query(
        'UPDATE pg_lead_metrics SET total_inquiries = total_inquiries + 1 WHERE pg_id = ? AND metric_date = ?',
        [pg_id, today]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Inquiry created successfully',
      inquiry_id: inquiryId
    });
  } catch (error) {
    console.error('Create inquiry error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * List inquiries (owner side)
 * GET /api/inquiry/list
 */
const listInquiries = async (req, res) => {
  try {
    const { pg_id, status, page = 1, limit = 20 } = req.query;
    const { role, pg_id: userPgId } = req.user || {};

    // Validate PG ID
    if (!pg_id) {
      return res.status(400).json({
        success: false,
        error: 'pg_id parameter is required'
      });
    }

    // Authorization check
    if (role === 'pg_admin' && userPgId != pg_id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build query for inquiries
    let inquiriesQuery = `
      SELECT bi.*, 
             tu.name AS tenant_name, tu.phone AS tenant_phone, 
             tu.email AS tenant_email, tu.profession AS tenant_profession,
             r.room_name, r.rent_per_bed, r.gender_type,
             p.name AS pg_name
      FROM booking_inquiries bi
      LEFT JOIN tenant_users tu ON bi.tenant_user_id = tu.id
      LEFT JOIN rooms r ON bi.room_id = r.id
      LEFT JOIN pgs p ON bi.pg_id = p.id
      WHERE bi.pg_id = ?
    `;
    const queryParams = [pg_id];

    if (status && status !== 'all') {
      inquiriesQuery += ' AND bi.status = ?';
      queryParams.push(status);
    }

    inquiriesQuery += ' ORDER BY bi.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), offset);

    const [inquiries] = await database.query(inquiriesQuery, queryParams);

    // Count total
    let countQuery = 'SELECT COUNT(*) AS count FROM booking_inquiries WHERE pg_id = ?';
    const countParams = [pg_id];
    if (status && status !== 'all') {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    const [countResult] = await database.query(countQuery, countParams);
    const total = countResult[0].count;

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      data: inquiries
    });
  } catch (error) {
    console.error('List inquiries error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get inquiry by ID
 * GET /api/inquiry/:id
 */
const getInquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, pg_id: userPgId } = req.user || {};

    const [inquiries] = await database.query(
      `SELECT bi.*, 
              tu.name AS tenant_name, tu.phone AS tenant_phone, 
              tu.email AS tenant_email, tu.profession AS tenant_profession,
              r.room_name, r.rent_per_bed, r.gender_type,
              p.name AS pg_name, p.address AS pg_address
       FROM booking_inquiries bi
       LEFT JOIN tenant_users tu ON bi.tenant_user_id = tu.id
       LEFT JOIN rooms r ON bi.room_id = r.id
       LEFT JOIN pgs p ON bi.pg_id = p.id
       WHERE bi.id = ?`,
      [id]
    );

    if (inquiries.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inquiry not found'
      });
    }

    const inquiry = inquiries[0];

    // Authorization check
    if (role === 'pg_admin' && userPgId != inquiry.pg_id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    console.error('Get inquiry error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Update inquiry status
 * PATCH /api/inquiry/:id/status
 */
const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role, pg_id: userPgId } = req.user || {};

    // Validate status
    const allowedStatuses = ['NEW', 'CONTACTED', 'VISITED', 'BOOKED', 'REJECTED'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    // Get current inquiry
    const inquiry = await BookingInquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: 'Inquiry not found'
      });
    }

    // Authorization check
    if (role === 'pg_admin' && userPgId != inquiry.pg_id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Validate status transition
    const currentStatus = inquiry.status;
    const validTransitions = {
      'NEW': ['CONTACTED', 'REJECTED'],
      'CONTACTED': ['VISITED', 'REJECTED'],
      'VISITED': ['BOOKED', 'REJECTED'],
      'BOOKED': [],
      'REJECTED': []
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status transition from ${currentStatus} to ${status}`
      });
    }

    // Update status
    await database.query(
      'UPDATE booking_inquiries SET status = ? WHERE id = ?',
      [status, id]
    );

    // Update metrics based on status
    const today = new Date().toISOString().split('T')[0];
    if (status === 'CONTACTED') {
      const [metricsRows] = await database.query(
        'SELECT * FROM pg_lead_metrics WHERE pg_id = ? AND metric_date = ?',
        [inquiry.pg_id, today]
      );
      if (metricsRows.length === 0) {
        await database.query(
          'INSERT INTO pg_lead_metrics (pg_id, metric_date, contacted_inquiries) VALUES (?, ?, 1)',
          [inquiry.pg_id, today]
        );
      } else {
        await database.query(
          'UPDATE pg_lead_metrics SET contacted_inquiries = contacted_inquiries + 1 WHERE pg_id = ? AND metric_date = ?',
          [inquiry.pg_id, today]
        );
      }
    } else if (status === 'BOOKED') {
      const [metricsRows] = await database.query(
        'SELECT * FROM pg_lead_metrics WHERE pg_id = ? AND metric_date = ?',
        [inquiry.pg_id, today]
      );
      if (metricsRows.length === 0) {
        await database.query(
          'INSERT INTO pg_lead_metrics (pg_id, metric_date, booked_inquiries) VALUES (?, ?, 1)',
          [inquiry.pg_id, today]
        );
      } else {
        await database.query(
          'UPDATE pg_lead_metrics SET booked_inquiries = booked_inquiries + 1 WHERE pg_id = ? AND metric_date = ?',
          [inquiry.pg_id, today]
        );
      }

      // Optional: Create tenant record and assign bed
      // This can be implemented based on business logic
      // For now, we just update the metrics
    }

    res.json({
      success: true,
      message: 'Inquiry status updated successfully'
    });
  } catch (error) {
    console.error('Update inquiry status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  createInquiry,
  listInquiries,
  getInquiryById,
  updateInquiryStatus
};

