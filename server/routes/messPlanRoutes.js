const express = require('express');
const router = express.Router();
const messPlanController = require('../controller/messPlanController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/pg/:pg_id', authenticateToken, messPlanController.getMessPlans);
router.post('/', authenticateToken, messPlanController.createMessPlan);
router.put('/:id', authenticateToken, messPlanController.updateMessPlan);
router.delete('/:id', authenticateToken, messPlanController.deleteMessPlan);

module.exports = router;

