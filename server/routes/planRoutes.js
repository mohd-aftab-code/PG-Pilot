const express = require('express');
const router = express.Router();
const planController = require('../controller/planController');
const authenticateToken = require('../middleware/authMiddleware');

// Public endpoint for landing page
router.get('/public', planController.getPublicPlans);

// Protected routes (superadmin only)
router.get('/', authenticateToken, planController.getPlans);
router.get('/:id', authenticateToken, planController.getPlanById);
router.post('/', authenticateToken, planController.createPlan);
router.put('/:id', authenticateToken, planController.updatePlan);
router.delete('/:id', authenticateToken, planController.deletePlan);

module.exports = router;

