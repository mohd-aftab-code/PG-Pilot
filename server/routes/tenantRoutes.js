const express = require('express');
const router = express.Router();
const tenantController = require('../controller/tenantController');
const authenticateToken = require('../middleware/authMiddleware');
const { uploadTenantDoc } = require('../middleware/upload');

router.get('/pg/:pg_id', authenticateToken, tenantController.getTenants);
router.get('/:id', authenticateToken, tenantController.getTenantById);
router.post('/', authenticateToken, uploadTenantDoc.single('aadhaar'), tenantController.createTenant);
router.put('/:id', authenticateToken, uploadTenantDoc.single('aadhaar'), tenantController.updateTenant);
router.delete('/:id', authenticateToken, tenantController.deleteTenant);

module.exports = router;

