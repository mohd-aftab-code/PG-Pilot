const database = require('../config/database');

// Get all coupons (Superadmin only)
const getCoupons = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can view coupons' });
    }

    const [coupons] = await database.query('SELECT * FROM coupons ORDER BY expires_on DESC');
    res.json({ coupons });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single coupon
const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;
    const [coupons] = await database.query('SELECT * FROM coupons WHERE id = ?', [id]);
    if (coupons.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json({ coupon: coupons[0] });
  } catch (error) {
    console.error('Get coupon by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Validate coupon code
const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const [coupons] = await database.query('SELECT * FROM coupons WHERE code = ?', [code]);
    if (coupons.length === 0) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    const coupon = coupons[0];

    // Check expiry
    if (coupon.expires_on && new Date(coupon.expires_on) < new Date()) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    // Check max uses (simplified - you might want to track actual uses)
    res.json({ 
      valid: true, 
      discount_percent: coupon.discount_percent,
      coupon: coupon
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create coupon (Superadmin only)
const createCoupon = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can create coupons' });
    }

    const { code, discount_percent, max_uses, expires_on } = req.body;

    if (!code || !discount_percent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await database.query(
      'INSERT INTO coupons (code, discount_percent, max_uses, expires_on) VALUES (?, ?, ?, ?)',
      [code, discount_percent, max_uses || null, expires_on || null]
    );

    const [coupons] = await database.query('SELECT * FROM coupons WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Coupon created successfully', coupon: coupons[0] });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update coupon (Superadmin only)
const updateCoupon = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can update coupons' });
    }

    const { id } = req.params;
    const { code, discount_percent, max_uses, expires_on } = req.body;

    await database.query(
      'UPDATE coupons SET code = ?, discount_percent = ?, max_uses = ?, expires_on = ? WHERE id = ?',
      [code, discount_percent, max_uses, expires_on, id]
    );

    const [coupons] = await database.query('SELECT * FROM coupons WHERE id = ?', [id]);
    res.json({ message: 'Coupon updated successfully', coupon: coupons[0] });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete coupon (Superadmin only)
const deleteCoupon = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can delete coupons' });
    }

    const { id } = req.params;
    await database.query('DELETE FROM coupons WHERE id = ?', [id]);
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getCoupons,
  getCouponById,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};

