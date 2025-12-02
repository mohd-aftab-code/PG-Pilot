const express = require('express');
const router = express.Router();
const couponController = require('../controller/couponController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/', authenticateToken, couponController.getCoupons);
router.get('/:id', authenticateToken, couponController.getCouponById);
router.post('/validate', couponController.validateCoupon);
router.post('/', authenticateToken, couponController.createCoupon);
router.put('/:id', authenticateToken, couponController.updateCoupon);
router.delete('/:id', authenticateToken, couponController.deleteCoupon);

module.exports = router;

