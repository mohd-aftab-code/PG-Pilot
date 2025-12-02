const express = require('express');
const router = express.Router();
const billController = require('../controller/billController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/pg/:pg_id', authenticateToken, billController.getBills);
router.get('/:id', authenticateToken, billController.getBillById);
router.post('/', authenticateToken, billController.createBill);
router.put('/:id', authenticateToken, billController.updateBill);
router.delete('/:id', authenticateToken, billController.deleteBill);

module.exports = router;

