const express = require('express');
const router = express.Router();
const pgController = require('../controller/pgController');
const authenticateToken = require('../middleware/authMiddleware');
const { uploadPGImages } = require('../middleware/upload');

router.get('/', authenticateToken, pgController.getPGs);
router.get('/:id', authenticateToken, pgController.getPGById);
router.post('/', authenticateToken, uploadPGImages.array('images', 10), pgController.createPG);
router.put('/:id', authenticateToken, uploadPGImages.array('images', 10), pgController.updatePG);
router.delete('/:id', authenticateToken, pgController.deletePG);

module.exports = router;

