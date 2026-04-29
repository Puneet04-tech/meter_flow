const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'owner', 'consumer'], default: 'consumer' },
  plan: { type: String, enum: ['free', 'payg', 'pro', 'enterprise'], default: 'free' },
  walletBalance: { type: Number, default: 0, min: 0 }, // Wallet balance in USD
  stripeCustomerId: { type: String, sparse: true },
  autoRecharge: { type: Boolean, default: false },
  rechargeThreshold: { type: Number, default: 5 },
  rechargeAmount: { type: Number, default: 10 },
  createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  try {
    this.password = await bcrypt.hash(this.password, 10);
  } catch (err) {
    throw new Error('Password hashing failed: ' + err.message);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
