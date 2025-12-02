const express = require('express');
const router = express.Router();
const subscriptionPaymentController = require('../controller/subscriptionPaymentController');
const authenticateToken = require('../middleware/authMiddleware');

// Public route to get Razorpay key
router.get('/razorpay-key', subscriptionPaymentController.getRazorpayKey);

// Protected routes
router.post('/create-order', authenticateToken, subscriptionPaymentController.createSubscriptionOrder);
router.post('/verify', authenticateToken, subscriptionPaymentController.verifyPayment);

module.exports = router;

