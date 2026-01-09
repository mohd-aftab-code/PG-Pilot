const express = require('express');
const router = express.Router();
const bedController = require('../controller/bedController');
const authenticateToken = require('../middleware/authMiddleware');
const subscriptionGuard = require('../middleware/subscriptionGuard');

// Read operations - no subscription guard needed
router.get('/room/:room_id', authenticateToken, bedController.getBeds);
router.get('/:id', authenticateToken, bedController.getBedById);

// Write operations - require active subscription/trial
router.put('/:id/status', authenticateToken, subscriptionGuard, bedController.updateBedStatus);

module.exports = router;

