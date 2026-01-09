const express = require('express');
const router = express.Router();
const roomController = require('../controller/roomController');
const authenticateToken = require('../middleware/authMiddleware');
const subscriptionGuard = require('../middleware/subscriptionGuard');
const { uploadRoomImages } = require('../middleware/upload');

// Read operations - no subscription guard needed
router.get('/pg/:pg_id', authenticateToken, roomController.getRooms);
router.get('/:id', authenticateToken, roomController.getRoomById);

// Write operations - require active subscription/trial
router.post('/', authenticateToken, subscriptionGuard, uploadRoomImages.array('images', 10), roomController.createRoom);
router.put('/:id', authenticateToken, subscriptionGuard, uploadRoomImages.array('images', 10), roomController.updateRoom);
router.delete('/:id', authenticateToken, subscriptionGuard, roomController.deleteRoom);

module.exports = router;

