const express = require('express');
const router = express.Router();
const invoiceController = require('../controller/invoiceController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/pg/:pg_id', authenticateToken, invoiceController.getInvoices);
router.get('/:id', authenticateToken, invoiceController.getInvoiceById);
router.post('/', authenticateToken, invoiceController.createInvoice);
router.put('/:id', authenticateToken, invoiceController.updateInvoice);
router.delete('/:id', authenticateToken, invoiceController.deleteInvoice);

module.exports = router;

