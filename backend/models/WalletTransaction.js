const mongoose = require('mongoose');

const WalletTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['topup', 'deduction', 'refund'], 
    required: true 
  },
  amount: { type: Number, required: true, min: 0 },
  reason: { type: String }, // 'plan_upgrade', 'topup_payment', etc.
  stripePaymentId: { type: String },
  balanceBefore: { type: Number },
  balanceAfter: { type: Number },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('WalletTransaction', WalletTransactionSchema);
