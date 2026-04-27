const mongoose = require('mongoose');

const WebhookSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  url: { type: String, required: true },
  events: [{ type: String, required: true }], // e.g., ['invoice.created', 'usage.limit_reached']
  secret: { type: String, required: true },
  active: { type: Boolean, default: true },
  lastTriggered: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Webhook', WebhookSchema);
