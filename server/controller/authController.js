const database = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register/Signup
const signup = async (req, res) => {
  try {
    const { name, email, phone, password, role, pg_id } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Default role to 'pg_admin' if not provided
    const userRole = role || 'pg_admin';

    // Check if phone already exists
    const [existingUser] = await database.query(
      'SELECT id FROM users WHERE phone = ?',
      [phone]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await database.query(
      'INSERT INTO users (name, email, phone, password_hash, role, pg_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email || null, phone, password_hash, userRole, pg_id || null]
    );

    const userId = result.insertId;

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, phone, role: userRole, pg_id: pg_id || null },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userId,
        name,
        email,
        phone,
        role: userRole,
        pg_id: pg_id || null,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    // Find user
    const [users] = await database.query(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role, pg_id: user.pg_id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        pg_id: user.pg_id,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Logout
const logout = async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await database.query(
      'SELECT id, name, email, phone, role, pg_id, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  signup,
  login,
  logout,
  getCurrentUser,
};

