const mongoose = require('mongoose');

const ApiSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  baseUrl: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Api', ApiSchema);
