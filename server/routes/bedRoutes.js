const express = require('express');
const router = express.Router();
const bedController = require('../controller/bedController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/room/:room_id', authenticateToken, bedController.getBeds);
router.get('/:id', authenticateToken, bedController.getBedById);
router.put('/:id/status', authenticateToken, bedController.updateBedStatus);

module.exports = router;

