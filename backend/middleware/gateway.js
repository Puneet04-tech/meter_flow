const axios = require('axios');
const ApiKey = require('../models/ApiKey');
const UsageLog = require('../models/UsageLog');
const Api = require('../models/Api');
const Redis = require('ioredis');
const webhookService = require('../services/webhookService');

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

    // 3. Forward Request
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

      // 4. Log Usage (Async - don't block response)
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

      // 5. Check usage limits and trigger webhooks (Async)
      webhookService.checkUsageLimits(keyDoc.user).catch(err => {
        console.error('Usage limit check failed:', err);
      });

      res.status(response.status).json(response.data);
    } catch (proxyErr) {
      res.status(502).json({ error: 'Bad Gateway - Could not reach target API' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Gateway Error' });
  }
};
