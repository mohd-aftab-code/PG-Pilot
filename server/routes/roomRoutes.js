const express = require('express');
const router = express.Router();
const roomController = require('../controller/roomController');
const authenticateToken = require('../middleware/authMiddleware');
const { uploadRoomImages } = require('../middleware/upload');

router.get('/pg/:pg_id', authenticateToken, roomController.getRooms);
router.get('/:id', authenticateToken, roomController.getRoomById);
router.post('/', authenticateToken, uploadRoomImages.array('images', 10), roomController.createRoom);
router.put('/:id', authenticateToken, uploadRoomImages.array('images', 10), roomController.updateRoom);
router.delete('/:id', authenticateToken, roomController.deleteRoom);

module.exports = router;

