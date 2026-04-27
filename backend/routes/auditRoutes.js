const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const auth = require('../middleware/auth');

// User audit endpoints
router.get('/logs', auth, auditController.getUserAuditLogs);
router.get('/stats', auth, auditController.getAuditStats);

// Admin only endpoints
router.get('/system/logs', auth, auditController.getSystemAuditLogs);
router.get('/system/stats', auth, auditController.getSystemAuditStats);

module.exports = router;
