const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');

// Example route structure - Add your routes here
// router.use('/auth', authRoutes);
// router.use('/profile', authenticateToken, profileRoutes);
// router.use('/masters', authenticateToken, mastersRoutes);

// Basic test route
router.get('/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

module.exports = router;

