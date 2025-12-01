const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  if (!req.cookies || !req.cookies.token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  const token = req.cookies.token;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded; // Attach user info to req
    next();
  } catch (err) {
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

