const mongoose = require('mongoose');

const ApiKeySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  api: { type: mongoose.Schema.Types.ObjectId, ref: 'Api', required: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['active', 'revoked'], default: 'active' },
  lastUsed: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ApiKey', ApiKeySchema);
