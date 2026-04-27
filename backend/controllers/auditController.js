const auditService = require('../services/auditService');

exports.getUserAuditLogs = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      action: req.query.action,
      resource: req.query.resource,
      severity: req.query.severity,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await auditService.getUserAuditLogs(req.user.id, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAuditStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const stats = await auditService.getAuditStats(req.user.id, days);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin only endpoints
exports.getSystemAuditLogs = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      action: req.query.action,
      resource: req.query.resource,
      severity: req.query.severity,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await auditService.getSystemAuditLogs(options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSystemAuditStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const days = parseInt(req.query.days) || 30;
    const stats = await auditService.getAuditStats(null, days);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
