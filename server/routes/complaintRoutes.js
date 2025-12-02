const express = require('express');
const router = express.Router();
const complaintController = require('../controller/complaintController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/pg/:pg_id', authenticateToken, complaintController.getComplaints);
router.get('/tenant/:tenant_id', authenticateToken, complaintController.getComplaintsByTenant);
router.get('/:id', authenticateToken, complaintController.getComplaintById);
router.post('/', authenticateToken, complaintController.createComplaint);
router.put('/:id', authenticateToken, complaintController.updateComplaint);
router.delete('/:id', authenticateToken, complaintController.deleteComplaint);

module.exports = router;

