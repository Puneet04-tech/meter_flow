const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const auth = require('../middleware/auth');

router.get('/stats', auth, billingController.getUsageStats);
router.get('/calculate', auth, billingController.calculateBilling);

module.exports = router;
