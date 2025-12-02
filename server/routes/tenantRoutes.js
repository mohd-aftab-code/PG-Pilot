const express = require('express');
const router = express.Router();
const tenantController = require('../controller/tenantController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/pg/:pg_id', authenticateToken, tenantController.getTenants);
router.get('/:id', authenticateToken, tenantController.getTenantById);
router.post('/', authenticateToken, tenantController.createTenant);
router.put('/:id', authenticateToken, tenantController.updateTenant);
router.delete('/:id', authenticateToken, tenantController.deleteTenant);

module.exports = router;

