const UsageLog = require('../models/UsageLog');
const User = require('../models/User');

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
      currency: 'USD'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
