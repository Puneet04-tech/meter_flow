const UsageLog = require('../models/UsageLog');
const User = require('../models/User');
const ApiKey = require('../models/ApiKey');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const WalletTransaction = require('../models/WalletTransaction');
const stripeService = require('../services/stripeService');

// Initialize Stripe at module level
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');

console.log('[BILLING] Stripe initialized with key:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...' : 'NOT SET');

exports.getUsageStats = async (req, res) => {
  try {
    const stats = await UsageLog.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 },
          avgLatency: { $avg: "$latency" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.calculateBilling = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const totalRequests = await UsageLog.countDocuments({ userId: req.user.id });
    
    // Pricing logic: $0.1 per 100 requests for Pro, 1000 free for all
    let amount = 0;
    const freeTier = 1000;
    if (totalRequests > freeTier) {
      amount = ((totalRequests - freeTier) / 100) * 0.1;
    }

    res.json({
      totalRequests,
      freeTier,
      billableRequests: Math.max(0, totalRequests - freeTier),
      amount: amount.toFixed(2),
      currency: 'USD',
      status: user.plan
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getKeyStats = async (req, res) => {
  try {
    const stats = await UsageLog.aggregate([
      { $match: { userId: req.user.id } },
      { $group: {
          _id: '$apiKey',
          totalRequests: { $sum: 1 },
          avgLatency: { $avg: '$latency' },
          successRate: { $avg: { $cond: [{ $lt: ['$status', 400] }, 1, 0] } }
        }
      }
    ]);
    
    const statsWithKeyInfo = await Promise.all(stats.map(async (stat) => {
      const key = await ApiKey.findOne({ key: stat._id }).populate('api', 'name');
      return {
        keyId: stat._id,
        keyName: key?.name || 'Unknown',
        apiName: key?.api?.name || 'Unknown',
        totalRequests: stat.totalRequests,
        avgLatency: stat.avgLatency.toFixed(2),
        successRate: (stat.successRate * 100).toFixed(2)
      };
    }));
    
    res.json(statsWithKeyInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const totalRequests = await UsageLog.countDocuments({ userId: req.user.id });
    const apiCount = await require('../models/Api').countDocuments({ owner: req.user.id });
    const keyCount = await ApiKey.countDocuments({ user: req.user.id });
    
    res.json({
      ...user.toObject(),
      stats: {
        totalRequests,
        apiCount,
        keyCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { plan, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { plan, role },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.upgradePlan = async (req, res) => {
  try {
    const { plan } = req.body;
    
    if (!['free', 'pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }
    
    const user = await User.findById(req.user.id);
    
    // Plan costs
    const planCosts = {
      free: 0,
      pro: 29,
      enterprise: 0 // Custom pricing, requires contact
    };
    
    const cost = planCosts[plan] || 0;
    
    // Check if user has sufficient wallet balance for paid plans
    if (cost > 0 && user.walletBalance < cost) {
      return res.status(402).json({ 
        error: `Insufficient wallet balance. Required: $${cost}, Current: $${user.walletBalance.toFixed(2)}`,
        required: cost,
        current: user.walletBalance
      });
    }
    
    // Deduct from wallet if cost > 0
    if (cost > 0) {
      const balanceBefore = user.walletBalance;
      user.walletBalance -= cost;
      
      // Record transaction
      await WalletTransaction.create({
        user: req.user.id,
        type: 'deduction',
        amount: cost,
        reason: `plan_upgrade_to_${plan}`,
        balanceBefore,
        balanceAfter: user.walletBalance,
        status: 'completed'
      });
    }
    
    user.plan = plan;
    await user.save();
    
    console.log(`[BILLING] ✅ User upgraded to ${plan} plan (Cost: $${cost})`);
    res.json({ 
      success: true, 
      message: `Upgraded to ${plan} plan`,
      cost,
      newBalance: user.walletBalance,
      user: user.toObject()
    });
  } catch (error) {
    console.error('[BILLING] Upgrade error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Stripe subscription methods
exports.createSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    
    if (!['pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const subscription = await stripeService.createSubscription(req.user.id, plan);
    
    res.json({
      subscription,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const canceledSubscription = await stripeService.cancelSubscription(req.user.id);
    res.json(canceledSubscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.id })
      .populate('user', 'email');
    
    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(12);
    
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateInvoice = async (req, res) => {
  try {
    const invoice = await stripeService.generateInvoice(req.user.id);
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Enhanced billing calculation
exports.calculateBilling = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.id });
    const usage = await stripeService.calculateUsage(
      req.user.id,
      subscription?.currentPeriodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      subscription?.currentPeriodEnd || new Date()
    );
    
    const plan = stripeService.plans[subscription?.plan || 'free'];
    const billableRequests = Math.max(0, usage.totalRequests - plan.requests);
    
    let amount = 0;
    let ratePerRequest = 0;
    
    if (subscription?.plan === 'pro') {
      amount = 29; // Base fee
      ratePerRequest = 0.01;
      amount += billableRequests * ratePerRequest;
    } else if (subscription?.plan === 'enterprise') {
      amount = 99; // Base fee
      ratePerRequest = 0.005;
      amount += billableRequests * ratePerRequest;
    }

    res.json({
      plan: subscription?.plan || 'free',
      totalRequests: usage.totalRequests,
      freeTier: plan.requests,
      billableRequests,
      amount: amount.toFixed(2),
      ratePerRequest,
      currency: 'USD',
      status: subscription?.status || 'active',
      avgLatency: usage.avgLatency?.toFixed(2) || 0,
      successRate: ((usage.successRate || 0) * 100).toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Stripe webhook handler
exports.handleWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    await stripeService.handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
};

// ============ WALLET ENDPOINTS ============

// Get wallet balance
exports.getWalletBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const transactions = await WalletTransaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({
      balance: user.walletBalance,
      transactions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create Stripe payment intent for wallet topup
exports.createTopupIntent = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }
    
    const user = await User.findById(req.user.id);
    
    // Ensure user has Stripe customer ID
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: req.user.id.toString() }
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      metadata: {
        userId: req.user.id,
        type: 'wallet_topup'
      }
    });
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency: 'USD'
    });
  } catch (error) {
    console.error('[WALLET] Topup intent error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Confirm topup payment and add to wallet
exports.confirmTopup = async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body;
    
    if (!paymentIntentId || !amount) {
      return res.status(400).json({ error: 'Missing paymentIntentId or amount' });
    }
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Check payment succeeded
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: `Payment failed: ${paymentIntent.status}`,
        status: paymentIntent.status
      });
    }
    
    const user = await User.findById(req.user.id);
    const balanceBefore = user.walletBalance;
    user.walletBalance += amount;
    await user.save();
    
    // Record transaction
    const transaction = await WalletTransaction.create({
      user: req.user.id,
      type: 'topup',
      amount,
      reason: 'stripe_payment',
      stripePaymentId: paymentIntentId,
      balanceBefore,
      balanceAfter: user.walletBalance,
      status: 'completed',
      metadata: { stripeStatus: paymentIntent.status }
    });
    
    console.log(`[WALLET] ✅ Topup confirmed: $${amount} for user ${req.user.id}`);
    res.json({
      success: true,
      message: `Added $${amount} to wallet`,
      newBalance: user.walletBalance,
      transaction
    });
  } catch (error) {
    console.error('[WALLET] Topup confirm error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get wallet transaction history
exports.getWalletTransactions = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const transactions = await WalletTransaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await WalletTransaction.countDocuments({ user: req.user.id });
    
    res.json({
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
