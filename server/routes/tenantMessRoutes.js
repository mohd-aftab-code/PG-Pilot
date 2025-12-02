const express = require('express');
const router = express.Router();
const tenantMessController = require('../controller/tenantMessController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/tenant/:tenant_id', authenticateToken, tenantMessController.getTenantMess);
router.post('/', authenticateToken, tenantMessController.assignMessPlan);
router.delete('/tenant/:tenant_id', authenticateToken, tenantMessController.removeMessPlan);

module.exports = router;

