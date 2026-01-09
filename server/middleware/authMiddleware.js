const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Check for token in cookies
  if (!req.cookies || !req.cookies.token) {
    console.log('AuthMiddleware: No token found in cookies. Cookies:', req.cookies);
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  const token = req.cookies.token;
  console.log('AuthMiddleware: Token found, verifying...', { 
    tokenLength: token.length,
    tokenPreview: token.substring(0, 20) + '...'
  });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded; // Attach user info to req
    console.log('AuthMiddleware: Token verified successfully', {
      userId: req.user.id,
      role: req.user.role,
      pg_id: req.user.pg_id
    });
    next();
  } catch (err) {
    console.error('AuthMiddleware: Token verification failed:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// Middleware to check for specific role
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Access denied. ${role} role required.` });
    }
    
    next();
  };
};

module.exports = authenticateToken;
module.exports.requireRole = requireRole;

