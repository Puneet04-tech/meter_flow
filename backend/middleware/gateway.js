const axios = require('axios');
const ApiKey = require('../models/ApiKey');
const UsageLog = require('../models/UsageLog');
const Api = require('../models/Api');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

module.exports = async (req, res) => {
  const apiKeyString = req.headers['x-api-key'];
  const { apiPath } = req.params; // Expecting /gateway/:apiId/*

  if (!apiKeyString) return res.status(401).json({ error: 'API Key is missing' });

  try {
    // 1. Validate API Key (Cache this in production)
    const keyDoc = await ApiKey.findOne({ key: apiKeyString, status: 'active' }).populate('api');
    if (!keyDoc) return res.status(403).json({ error: 'Invalid or revoked API Key' });

    // 2. Rate Limiting (Redis-based)
    const rateLimitKey = `rl:${apiKeyString}`;
    const requests = await redis.incr(rateLimitKey);
    if (requests === 1) {
      await redis.expire(rateLimitKey, 60); // 1 minute window
    }
    if (requests > 100) { // Limit: 100 requests per minute
      return res.status(429).json({ error: 'Rate limit exceeded' });
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
      });

      res.status(response.status).json(response.data);
    } catch (proxyErr) {
      res.status(502).json({ error: 'Bad Gateway - Could not reach target API' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Gateway Error' });
  }
};
