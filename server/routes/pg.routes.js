const express = require('express');
const router = express.Router();
const pgController = require('../controller/pgController');
const authenticateToken = require('../middleware/authMiddleware');

// Marketplace public endpoints (no auth required)
router.get('/:pg_id', pgController.getPGDetail);

// Analytics endpoint (requires auth)
router.get('/:pg_id/analytics', authenticateToken, pgController.getPGAnalytics);

module.exports = router;

