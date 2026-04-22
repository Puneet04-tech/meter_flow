const mongoose = require('mongoose');

const UsageLogSchema = new mongoose.Schema({
  apiKey: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  apiId: { type: mongoose.Schema.Types.ObjectId, ref: 'Api', required: true },
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  status: { type: Number, required: true },
  latency: { type: Number }, // in ms
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UsageLog', UsageLogSchema);
