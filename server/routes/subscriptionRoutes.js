const express = require('express');
const router = express.Router();
const subscriptionController = require('../controller/subscriptionController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/pg/:pg_id', authenticateToken, subscriptionController.getSubscriptions);
router.get('/pg/:pg_id/active', authenticateToken, subscriptionController.getActiveSubscription);
router.post('/', authenticateToken, subscriptionController.createSubscription);
router.put('/:id', authenticateToken, subscriptionController.updateSubscription);

module.exports = router;

