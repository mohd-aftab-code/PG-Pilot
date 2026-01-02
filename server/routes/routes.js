const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');

// Import all route modules
const authRoutes = require('./authRoutes');
const pgRoutes = require('./pgRoutes');
const roomRoutes = require('./roomRoutes');
const bedRoutes = require('./bedRoutes');
const tenantRoutes = require('./tenantRoutes');
const paymentRoutes = require('./paymentRoutes');
const complaintRoutes = require('./complaintRoutes');
const messPlanRoutes = require('./messPlanRoutes');
const tenantMessRoutes = require('./tenantMessRoutes');
const messBillRoutes = require('./messBillRoutes');
const billRoutes = require('./billRoutes');
const planRoutes = require('./planRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const couponRoutes = require('./couponRoutes');
const referralRoutes = require('./referralRoutes');
const auditLogRoutes = require('./auditLogRoutes');
const subscriptionPaymentRoutes = require('./subscriptionPaymentRoutes');
const searchRoutes = require('./search.routes');
const inquiryRoutes = require('./inquiry.routes');
const pgMarketplaceRoutes = require('./pg.routes');

// Mount all routes
router.use('/auth', authRoutes);
router.use('/pgs', pgRoutes);
router.use('/rooms', roomRoutes);
router.use('/beds', bedRoutes);
router.use('/tenants', tenantRoutes);
router.use('/payments', paymentRoutes);
router.use('/complaints', complaintRoutes);
router.use('/mess-plans', messPlanRoutes);
router.use('/tenant-mess', tenantMessRoutes);
router.use('/mess-bills', messBillRoutes);
router.use('/bills', billRoutes);
router.use('/plans', planRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/coupons', couponRoutes);
router.use('/referrals', referralRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/subscription-payment', subscriptionPaymentRoutes);
router.use('/search', searchRoutes);
router.use('/inquiry', inquiryRoutes);
router.use('/pg', pgMarketplaceRoutes);

// Basic test route
router.get('/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

module.exports = router;

