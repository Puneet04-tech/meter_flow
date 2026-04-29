const axios = require('axios');
const ApiKey = require('../models/ApiKey');
const UsageLog = require('../models/UsageLog');
const Api = require('../models/Api');
const User = require('../models/User');
const Redis = require('ioredis');
const webhookService = require('../services/webhookService');
const billingController = require('../controllers/billingController');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  }
});

redis.on('error', (err) => {
  // Silent console log instead of crashing
  console.log('⚡ Redis Offline - Continuing with fallback...');
});

module.exports = async (req, res) => {
  const apiKeyString = req.headers['x-api-key'];

  if (!apiKeyString) return res.status(401).json({ error: 'API Key is missing' });

  try {
    const keyDoc = await ApiKey.findOne({ key: apiKeyString, status: 'active' }).populate('api');
    if (!keyDoc) return res.status(403).json({ error: 'Invalid or revoked API Key' });

    // 2. Rate Limiting (With Fallback)
    try {
      if (redis.status === 'ready') {
        const rateLimitKey = `rl:${apiKeyString}`;
        const requests = await redis.incr(rateLimitKey);
        if (requests === 1) await redis.expire(rateLimitKey, 60);
        if (requests > 100) return res.status(429).json({ error: 'Rate limit exceeded' });
      }
    } catch (redisErr) {
      console.log('Skipping rate limit check (Redis Error)');
    }

    // 3. Monthly Rate Limiting based on user plan
    try {
      const user = await User.findById(keyDoc.user);
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const monthlyLimitKey = `monthly:${keyDoc.user}:${currentMonth}`;
      
      console.log(`[RATE_LIMIT] Checking monthly limit for user ${keyDoc.user}, plan: ${user.plan}`);
      
      let monthlyLimit = 1000; // Default for paid plans
      if (user.plan === 'free') {
        monthlyLimit = 5; // 5 requests per month for free plan
      } else if (user.plan === 'pro') {
        monthlyLimit = 50000; // 50,000 requests per month for pro
      } else if (user.plan === 'enterprise') {
        monthlyLimit = 100000; // 100,000 requests per month for enterprise
      }
      // Pay As You Go has no monthly limit
      
      if (user.plan !== 'payg') {
        if (redis.status === 'ready') {
          const monthlyRequests = await redis.incr(monthlyLimitKey);
          if (monthlyRequests === 1) await redis.expire(monthlyLimitKey, 30 * 24 * 60 * 60); // 30 days
          console.log(`[RATE_LIMIT] Redis: Monthly requests: ${monthlyRequests}/${monthlyLimit} for user ${keyDoc.user}`);
          if (monthlyRequests > monthlyLimit) {
            console.log(`[RATE_LIMIT] Monthly limit exceeded: ${monthlyRequests}/${monthlyLimit} for user ${keyDoc.user}`);
            const errorResponse = { 
              error: 'Monthly rate limit exceeded',
              message: `You have exceeded your monthly limit of ${monthlyLimit} requests. Please upgrade your plan.`,
              monthlyLimit,
              currentUsage: monthlyRequests,
              resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
              plan: user.plan
            };
            return res.status(429).set('Content-Type', 'application/json').json(errorResponse);
          }
        } else {
          // Redis offline - fallback to database tracking
          console.log(`[RATE_LIMIT] Redis offline - using database fallback for user ${keyDoc.user}`);
          
          // Get usage logs for current month
          const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
          const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
          
          const monthlyRequests = await UsageLog.countDocuments({
            userId: keyDoc.user,
            timestamp: { $gte: monthStart, $lt: monthEnd }
          });
          
          console.log(`[RATE_LIMIT] DB: Monthly requests: ${monthlyRequests}/${monthlyLimit} for user ${keyDoc.user}`);
          
          if (monthlyRequests > monthlyLimit) {
            const errorResponse = { 
              error: 'Monthly rate limit exceeded',
              message: `You have exceeded your monthly limit of ${monthlyLimit} requests. Please upgrade your plan.`,
              monthlyLimit,
              currentUsage: monthlyRequests,
              resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
              plan: user.plan
            };
            return res.status(429).set('Content-Type', 'application/json').json(errorResponse);
          }
        }
      }
    } catch (monthlyErr) {
      console.error('[RATE_LIMIT] Monthly rate limit check error:', monthlyErr.message);
      // Don't continue - rate limiting failed, so block the request
      return res.status(500).json({ 
        error: 'Rate limiting service unavailable',
        message: 'Unable to verify rate limits. Please try again later.'
      });
    }

    // 4. Forward Request
    const targetUrl = `${keyDoc.api.baseUrl}${req.url.replace('/gateway/' + keyDoc.api._id, '')}`;
    const startTime = Date.now();

    try {
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true, // Don't throw on 4xx/5xx
      });

      const duration = Date.now() - startTime;

      // 5. Log Usage (Async - don't block response)
      UsageLog.create({
        apiKey: apiKeyString,
        userId: keyDoc.user,
        apiId: keyDoc.api._id,
        endpoint: req.url,
        method: req.method,
        status: response.status,
        latency: duration
      }).catch(err => {
        console.error('[GATEWAY] Failed to log usage:', err.message);
      });

      // 6. Check usage limits and trigger webhooks (Async)
      webhookService.checkUsageLimits(keyDoc.user).catch(err => {
        console.error('Usage limit check failed:', err);
      });

      // 7. Handle Pay As You Go billing (Async)
      if (response.status < 400) {
        billingController.deductPayAsYouGoUsage(keyDoc.user, 1).catch(err => {
          console.error('Pay As You Go billing failed:', err);
        });
      }

      res.status(response.status).json(response.data);
    } catch (proxyErr) {
      res.status(502).json({ error: 'Bad Gateway - Could not reach target API' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Gateway Error' });
  }
};
