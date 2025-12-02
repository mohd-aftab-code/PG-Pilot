const express = require('express');
const router = express.Router();
const paymentController = require('../controller/paymentController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/pg/:pg_id', authenticateToken, paymentController.getPayments);
router.get('/tenant/:tenant_id', authenticateToken, paymentController.getPaymentsByTenant);
router.post('/', authenticateToken, paymentController.createPayment);
router.put('/:id', authenticateToken, paymentController.updatePayment);
router.delete('/:id', authenticateToken, paymentController.deletePayment);

module.exports = router;

