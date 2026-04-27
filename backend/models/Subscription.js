const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  stripeCustomerId: { type: String, required: true },
  stripeSubscriptionId: { type: String },
  plan: { 
    type: String, 
    enum: ['free', 'pro', 'enterprise'], 
    default: 'free',
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'canceled', 'past_due', 'unpaid'],
    default: 'active' 
  },
  currentPeriodStart: { type: Date },
  currentPeriodEnd: { type: Date },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

SubscriptionSchema.pre('save', function() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);
