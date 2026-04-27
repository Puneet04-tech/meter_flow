const UsageLog = require('../models/UsageLog');
const User = require('../models/User');
const ApiKey = require('../models/ApiKey');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const stripeService = require('../services/stripeService');

exports.getUsageStats = async (req, res) => {
  try {
    console.log('[ANALYTICS] Getting usage stats for user:', req.user.id);
    
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
    
    console.log('[ANALYTICS] Usage stats found:', stats);
    res.json(stats);
  } catch (error) {
    console.error('[ANALYTICS] Error:', error);
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
    console.log('[KEY_STATS] Getting key stats for user:', req.user.id);
    
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
    
    console.log('[KEY_STATS] Raw stats:', stats);
    
    const statsWithKeyInfo = await Promise.all(stats.map(async (stat) => {
      const key = await ApiKey.findOne({ key: stat._id }).populate('api', 'name');
      console.log('[KEY_STATS] Key found:', key?.name, 'for apiKey:', stat._id);
      return {
        keyId: stat._id,
        keyName: key?.name || 'Unknown',
        apiName: key?.api?.name || 'Unknown',
        totalRequests: stat.totalRequests,
        avgLatency: stat.avgLatency.toFixed(2),
        successRate: (stat.successRate * 100).toFixed(2)
      };
    }));
    
    console.log('[KEY_STATS] Final stats with key info:', statsWithKeyInfo);
    res.json(statsWithKeyInfo);
  } catch (error) {
    console.error('[KEY_STATS] Error:', error);
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
