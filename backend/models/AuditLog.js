const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true }, // e.g., 'login', 'api_key_created', 'subscription_updated'
  resource: { type: String, required: true }, // e.g., 'user', 'api_key', 'subscription'
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: mongoose.Schema.Types.Mixed }, // Additional context
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low' 
  }
});

// Index for efficient queries
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ severity: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
