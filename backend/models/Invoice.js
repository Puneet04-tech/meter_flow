const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  stripeInvoiceId: { type: String, required: true },
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  amount: { type: Number, required: true }, // in cents
  currency: { type: String, default: 'usd' },
  status: { 
    type: String, 
    enum: ['draft', 'open', 'paid', 'void', 'uncollectible'],
    default: 'draft' 
  },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  usage: {
    totalRequests: { type: Number, default: 0 },
    ratePerRequest: { type: Number, default: 0 },
    baseFee: { type: Number, default: 0 }
  },
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
