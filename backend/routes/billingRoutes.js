const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const auth = require('../middleware/auth');

router.get('/stats', auth, billingController.getUsageStats);
router.get('/calculate', auth, billingController.calculateBilling);
router.get('/key-stats', auth, billingController.getKeyStats);
router.get('/profile', auth, billingController.getUserProfile);
router.put('/profile', auth, billingController.updateUserProfile);

// Subscription routes
router.post('/subscription', auth, billingController.createSubscription);
router.delete('/subscription', auth, billingController.cancelSubscription);
router.get('/subscription', auth, billingController.getSubscription);
router.get('/invoices', auth, billingController.getInvoices);
router.post('/invoices/generate', auth, billingController.generateInvoice);

// Webhook route (no auth required)
router.post('/webhook', billingController.handleWebhook);

module.exports = router;
