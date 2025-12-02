const express = require('express');
const router = express.Router();
const pgController = require('../controller/pgController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/', authenticateToken, pgController.getPGs);
router.get('/:id', authenticateToken, pgController.getPGById);
router.post('/', authenticateToken, pgController.createPG);
router.put('/:id', authenticateToken, pgController.updatePG);
router.delete('/:id', authenticateToken, pgController.deletePG);

module.exports = router;

