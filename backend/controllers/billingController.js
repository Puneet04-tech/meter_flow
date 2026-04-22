const UsageLog = require('../models/UsageLog');
const User = require('../models/User');
const ApiKey = require('../models/ApiKey');

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
