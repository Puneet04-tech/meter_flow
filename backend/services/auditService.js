const AuditLog = require('../models/AuditLog');

class AuditService {
  constructor() {
    this.actions = {
      // Authentication
      LOGIN: 'login',
      LOGOUT: 'logout',
      REGISTER: 'register',
      PASSWORD_CHANGE: 'password_change',
      
      // API Management
      API_CREATED: 'api_created',
      API_UPDATED: 'api_updated',
      API_DELETED: 'api_deleted',
      API_KEY_CREATED: 'api_key_created',
      API_KEY_REVOKED: 'api_key_revoked',
      API_KEY_REGENERATED: 'api_key_regenerated',
      
      // Billing & Subscription
      SUBSCRIPTION_CREATED: 'subscription_created',
      SUBSCRIPTION_UPDATED: 'subscription_updated',
      SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
      INVOICE_GENERATED: 'invoice_generated',
      PAYMENT_SUCCESS: 'payment_success',
      PAYMENT_FAILED: 'payment_failed',
      
      // Usage
      USAGE_LIMIT_REACHED: 'usage_limit_reached',
      RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
      
      // Security
      SUSPICIOUS_ACTIVITY: 'suspicious_activity',
      UNAUTHORIZED_ACCESS: 'unauthorized_access',
      DATA_EXPORT: 'data_export',
      
      // System
      WEBHOOK_CREATED: 'webhook_created',
      WEBHOOK_DELETED: 'webhook_deleted',
      SETTINGS_UPDATED: 'settings_updated'
    };

    this.severity = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
  }

  async log(userId, action, resource, resourceId = null, details = {}, severity = this.severity.LOW, req = null) {
    try {
      const auditLog = new AuditLog({
        userId,
        action,
        resource,
        resourceId,
        details,
        severity,
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.get('User-Agent')
      });

      await auditLog.save();
      return auditLog;
    } catch (error) {
      console.error('Audit log error:', error);
      // Don't throw - audit logging should never break the main flow
    }
  }

  async logAuth(userId, action, details = {}, req = null) {
    return this.log(userId, action, 'user', userId, details, this.severity.MEDIUM, req);
  }

  async logAPIAction(userId, action, resourceId, details = {}, req = null) {
    const severity = action.includes('deleted') || action.includes('revoked') 
      ? this.severity.HIGH 
      : this.severity.MEDIUM;
    
    return this.log(userId, action, 'api', resourceId, details, severity, req);
  }

  async logBillingAction(userId, action, resourceId, details = {}, req = null) {
    const severity = action.includes('failed') || action.includes('cancelled')
      ? this.severity.HIGH
      : this.severity.MEDIUM;
    
    return this.log(userId, action, 'billing', resourceId, details, severity, req);
  }

  async logSecurityEvent(userId, action, details = {}, req = null) {
    return this.log(userId, action, 'security', null, details, this.severity.HIGH, req);
  }

  async getUserAuditLogs(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        resource,
        severity,
        startDate,
        endDate
      } = options;

      const query = { userId };

      if (action) query.action = action;
      if (resource) query.resource = resource;
      if (severity) query.severity = severity;
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const logs = await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('userId', 'email')
        .lean();

      const total = await AuditLog.countDocuments(query);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get audit logs: ${error.message}`);
    }
  }

  async getSystemAuditLogs(options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        resource,
        severity,
        startDate,
        endDate
      } = options;

      const query = {};

      if (action) query.action = action;
      if (resource) query.resource = resource;
      if (severity) query.severity = severity;
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const logs = await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('userId', 'email')
        .lean();

      const total = await AuditLog.countDocuments(query);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get system audit logs: ${error.message}`);
    }
  }

  async getAuditStats(userId = null, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const matchStage = {
        timestamp: { $gte: startDate }
      };

      if (userId) {
        matchStage.userId = new mongoose.Types.ObjectId(userId);
      }

      const stats = await AuditLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalLogs: { $sum: 1 },
            criticalEvents: {
              $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
            },
            highEvents: {
              $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
            },
            mediumEvents: {
              $sum: { $cond: [{ $eq: ['$severity', 'medium'] }, 1, 0] }
            },
            lowEvents: {
              $sum: { $cond: [{ $eq: ['$severity', 'low'] }, 1, 0] }
            },
            actionBreakdown: {
              $push: {
                action: '$action',
                severity: '$severity',
                timestamp: '$timestamp'
              }
            }
          }
        }
      ]);

      const dailyStats = await AuditLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 },
            critical: {
              $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
            },
            high: {
              $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
            }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      return {
        summary: stats[0] || {
          totalLogs: 0,
          criticalEvents: 0,
          highEvents: 0,
          mediumEvents: 0,
          lowEvents: 0
        },
        dailyStats
      };
    } catch (error) {
      throw new Error(`Failed to get audit stats: ${error.message}`);
    }
  }

  async cleanupOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await AuditLog.deleteMany({
        timestamp: { $lt: cutoffDate },
        severity: { $in: ['low', 'medium'] }
      });

      console.log(`Cleaned up ${result.deletedCount} old audit logs`);
      return result.deletedCount;
    } catch (error) {
      console.error('Audit log cleanup error:', error);
    }
  }
}

module.exports = new AuditService();
