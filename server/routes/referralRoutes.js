const express = require('express');
const router = express.Router();
const referralController = require('../controller/referralController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/', authenticateToken, referralController.getReferrals);
router.post('/', authenticateToken, referralController.createReferral);
router.put('/:id/activate', authenticateToken, referralController.activateReferral);

module.exports = router;

