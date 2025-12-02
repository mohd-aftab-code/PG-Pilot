const express = require('express');
const router = express.Router();
const messBillController = require('../controller/messBillController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/pg/:pg_id', authenticateToken, messBillController.getMessBills);
router.get('/tenant/:tenant_id', authenticateToken, messBillController.getMessBillsByTenant);
router.post('/', authenticateToken, messBillController.createMessBill);
router.put('/:id', authenticateToken, messBillController.updateMessBill);
router.delete('/:id', authenticateToken, messBillController.deleteMessBill);

module.exports = router;

