const express = require('express');
const router = express.Router();
const tenantController = require('../controller/tenantController');
const authenticateToken = require('../middleware/authMiddleware');
const subscriptionGuard = require('../middleware/subscriptionGuard');
const { uploadTenantDoc } = require('../middleware/upload');

// Read operations - no subscription guard needed
router.get('/pg/:pg_id', authenticateToken, tenantController.getTenants);
router.get('/:id', authenticateToken, tenantController.getTenantById);

// Write operations - require active subscription/trial
router.post('/', authenticateToken, subscriptionGuard, uploadTenantDoc.single('aadhaar'), tenantController.createTenant);
router.put('/:id', authenticateToken, subscriptionGuard, uploadTenantDoc.single('aadhaar'), tenantController.updateTenant);
router.delete('/:id', authenticateToken, subscriptionGuard, tenantController.deleteTenant);

module.exports = router;

