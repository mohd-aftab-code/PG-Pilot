const database = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

// Helper function to generate JWT token
const generateToken = (user) => {
  const tokenPayload = {
    id: user.id,
    role: user.role,
    pg_id: user.pg_id || null,
  };
  
  // Add identifier based on auth method
  if (user.google_id) {
    tokenPayload.google_id = user.google_id;
  } else if (user.phone) {
    tokenPayload.phone = user.phone;
  }

  return jwt.sign(
    tokenPayload,
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// Helper function to set auth cookie
const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Helper function to format user response
const formatUserResponse = (user) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email || null,
    phone: user.phone || null,
    google_id: user.google_id || null,
    role: user.role,
    pg_id: user.pg_id || null,
  };
};

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

    // Create user object for token generation
    const newUser = {
      id: userId,
      phone,
      role: userRole,
      pg_id: pg_id || null,
    };

    // Generate JWT token and set cookie
    const token = generateToken(newUser);
    setAuthCookie(res, token);

    res.status(201).json({
      message: 'User registered successfully',
      user: formatUserResponse({
        id: userId,
        name,
        email: email || null,
        phone,
        role: userRole,
        pg_id: pg_id || null,
      }),
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

    // Generate JWT token and set cookie
    const token = generateToken(user);
    setAuthCookie(res, token);

    res.json({
      message: 'Login successful',
      user: formatUserResponse(user),
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
      'SELECT id, name, email, phone, google_id, role, pg_id, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = formatUserResponse(users[0]);
    
    // If user has pg_id, fetch PG details
    if (user.pg_id) {
      try {
        const [pgs] = await database.query(
          `SELECT id, pg_uid, name, address, city, area, pincode, food_enabled, default_due_day, images, created_at 
           FROM pgs WHERE id = ?`,
          [user.pg_id]
        );
        
        if (pgs.length > 0) {
          const pg = pgs[0];
          user.pg_details = {
            id: pg.id,
            pg_uid: pg.pg_uid,
            name: pg.name,
            address: pg.address,
            city: pg.city,
            area: pg.area,
            pincode: pg.pincode,
            food_enabled: pg.food_enabled === 1,
            default_due_day: pg.default_due_day,
            images: pg.images ? (typeof pg.images === 'string' ? JSON.parse(pg.images) : pg.images) : null,
            created_at: pg.created_at
          };
        }
      } catch (pgError) {
        console.error('Error fetching PG details:', pgError);
        // Don't fail the request if PG fetch fails
      }
    }

    res.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Google OAuth Login/Signup
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    // Check if GOOGLE_CLIENT_ID is set
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.error('GOOGLE_CLIENT_ID is not set in server environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error: Google Client ID is not configured. Please set GOOGLE_CLIENT_ID in server .env file.' 
      });
    }

    // Verify Google token
    const client = new OAuth2Client(googleClientId);
    let ticket;
    
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: googleClientId,
      });
    } catch (error) {
      // Decode token to get audience for better error message
      let tokenAudience = null;
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) {
            base64 += '=';
          }
          const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
          tokenAudience = payload.aud;
        }
      } catch (decodeError) {
        // Ignore decode errors, just use generic error message
      }

      if (error.message && error.message.includes('Wrong recipient')) {
        console.error('Google Client ID mismatch:', {
          tokenAudience: tokenAudience || 'Could not decode',
          backendClientId: googleClientId.substring(0, 30) + '...'
        });
        
        return res.status(401).json({ 
          error: 'Google Client ID mismatch',
          message: 'The token was issued for a different Client ID than the one configured on the server.',
          fix: 'Please ensure VITE_GOOGLE_CLIENT_ID (frontend .env) and GOOGLE_CLIENT_ID (backend .env) are the exact same value.'
        });
      }
      
      console.error('Google token verification error:', error.message);
      return res.status(401).json({ 
        error: 'Invalid Google token',
        details: error.message 
      });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Email is required from Google account' });
    }

    if (!googleId) {
      return res.status(400).json({ error: 'Google ID is required from Google account' });
    }

    // Check if user exists by google_id (preferred) or email
    let [existingUsers] = await database.query(
      'SELECT * FROM users WHERE google_id = ? OR email = ?',
      [googleId, email]
    );

    let user;
    let userId;

    if (existingUsers.length > 0) {
      // User exists, login
      user = existingUsers[0];
      userId = user.id;

      // Update user info if needed
      const updates = [];
      const updateValues = [];

      // Update google_id if not set (for users who signed up with email first)
      if (!user.google_id) {
        updates.push('google_id = ?');
        updateValues.push(googleId);
      }

      // Update name if changed
      if (name && name !== user.name) {
        updates.push('name = ?');
        updateValues.push(name);
      }

      // Update email if changed
      if (email && email !== user.email) {
        updates.push('email = ?');
        updateValues.push(email);
      }

      // Execute updates if any
      if (updates.length > 0) {
        updateValues.push(userId);
        await database.query(
          `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
          updateValues
        );
        // Refresh user data
        user.google_id = user.google_id || googleId;
        user.name = name || user.name;
        user.email = email || user.email;
      }
    } else {
      // New user, create account
      // Insert new user with google_id, phone will be NULL (user can add later if needed)
      const [result] = await database.query(
        'INSERT INTO users (name, email, google_id, password_hash, role, pg_id) VALUES (?, ?, ?, ?, ?, ?)',
        [name || email.split('@')[0], email, googleId, null, 'pg_admin', null]
      );

      userId = result.insertId;
      user = {
        id: userId,
        name: name || email.split('@')[0],
        email: email,
        phone: null, // Phone is NULL for Google users
        google_id: googleId,
        role: 'pg_admin',
        pg_id: null,
      };
    }

    // Generate JWT token and set cookie
    const token = generateToken(user);
    setAuthCookie(res, token);

    res.json({
      message: existingUsers.length > 0 ? 'Login successful' : 'Account created successfully',
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  signup,
  login,
  logout,
  getCurrentUser,
  googleAuth,
};

