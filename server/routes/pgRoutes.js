const express = require('express');
const router = express.Router();
const pgController = require('../controller/pgController');
const authenticateToken = require('../middleware/authMiddleware');
const subscriptionGuard = require('../middleware/subscriptionGuard');
const { uploadPGImages } = require('../middleware/upload');

// Read operations - no subscription guard needed
router.get('/', authenticateToken, pgController.getPGs);
router.get('/:id', authenticateToken, pgController.getPGById);

// Create PG - no guard (this is where trial starts)
router.post('/', authenticateToken, uploadPGImages.array('images', 10), pgController.createPG);

// Write operations - require active subscription/trial
router.put('/:id', authenticateToken, subscriptionGuard, uploadPGImages.array('images', 10), pgController.updatePG);
router.delete('/:id', authenticateToken, subscriptionGuard, pgController.deletePG);

module.exports = router;

