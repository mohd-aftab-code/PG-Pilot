const express = require('express');
const router = express.Router();
const roomController = require('../controller/roomController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/pg/:pg_id', authenticateToken, roomController.getRooms);
router.get('/:id', authenticateToken, roomController.getRoomById);
router.post('/', authenticateToken, roomController.createRoom);
router.put('/:id', authenticateToken, roomController.updateRoom);
router.delete('/:id', authenticateToken, roomController.deleteRoom);

module.exports = router;

