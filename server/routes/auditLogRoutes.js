const express = require('express');
const router = express.Router();
const auditLogController = require('../controller/auditLogController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/', authenticateToken, auditLogController.getAuditLogs);

module.exports = router;

