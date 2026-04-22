const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const auth = require('../middleware/auth');

router.get('/stats', auth, billingController.getUsageStats);
router.get('/calculate', auth, billingController.calculateBilling);
router.get('/key-stats', auth, billingController.getKeyStats);
router.get('/profile', auth, billingController.getUserProfile);
router.put('/profile', auth, billingController.updateUserProfile);

module.exports = router;
