const express = require('express');
const router = express.Router();
const inquiryController = require('../controller/inquiryController');
const authenticateToken = require('../middleware/authMiddleware');

// Create inquiry (public endpoint - tenant users can create)
router.post('/', inquiryController.createInquiry);

// List inquiries (owner side - requires auth)
router.get('/list', authenticateToken, inquiryController.listInquiries);

// Get inquiry by ID (requires auth)
router.get('/:id', authenticateToken, inquiryController.getInquiryById);

// Update inquiry status (requires auth)
router.patch('/:id/status', authenticateToken, inquiryController.updateInquiryStatus);

module.exports = router;

