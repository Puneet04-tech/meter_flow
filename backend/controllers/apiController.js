const crypto = require('crypto');
const ApiKey = require('../models/ApiKey');
const Api = require('../models/Api');
const UsageLog = require('../models/UsageLog');
const webhookService = require('../services/webhookService');

exports.createApi = async (req, res) => {
  try {
    const { name, baseUrl, description } = req.body;
    const api = new Api({
      owner: req.user.id,
      name,
      baseUrl,
      description
    });
    await api.save();
    res.status(201).json(api);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateKey = async (req, res) => {
  console.log('🔑 generateKey controller called');
  try {
    console.log('[GENERATE_KEY] req.user:', req.user);
    const { apiId, name } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      console.error('[GENERATE_KEY] No userId in req.user');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    let api = null;
    if (apiId) {
      api = await Api.findById(apiId);
      if (!api) return res.status(404).json({ error: 'API not found' });
    } else {
      // Create a default API if none is provided
      api = new Api({
        owner: userId,
        name: name || 'Default API',
        baseUrl: 'https://api.example.com',
        description: 'Default API created automatically'
      });
      await api.save();
    }

    // Generate a secure API Key
    const key = `mf_${crypto.randomBytes(24).toString('hex')}`;
    
    const apiKey = new ApiKey({
      key,
      user: userId,
      api: api._id,
      name: name || 'Default Key'
    });

    await apiKey.save();
    
    // Trigger webhook for API key creation
    await webhookService.triggerWebhook(userId, webhookService.events.API_KEY_CREATED, {
      keyId: apiKey._id,
      keyName: apiKey.name,
      apiId: api._id,
      apiName: api.name
    });
    
    res.status(201).json({ _id: apiKey._id, name: apiKey.name, key, status: 'active', createdAt: apiKey.createdAt });
  } catch (error) {
    console.error('[GENERATE_KEY] Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.revokeKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const apiKey = await ApiKey.findOneAndUpdate(
      { _id: keyId, user: req.user.id },
      { status: 'revoked' },
      { new: true }
    );
    if (!apiKey) return res.status(404).json({ error: 'Key not found' });
    
    // Trigger webhook for API key revocation
    await webhookService.triggerWebhook(req.user.id, webhookService.events.API_KEY_REVOKED, {
      keyId: apiKey._id,
      keyName: apiKey.name,
      revokedAt: new Date()
    });
    
    res.json({ message: 'API Key revoked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find({ user: req.user.id, status: { $ne: 'revoked' } }).populate('api', 'name').sort({ createdAt: -1 });
    
    // Add rate limit info to each key
    const keysWithLimits = await Promise.all(keys.map(async (key) => {
      const usageCount = await UsageLog.countDocuments({ apiKey: key.key });
      return {
        ...key.toObject(),
        usage: usageCount
      };
    }));
    
    res.json(keysWithLimits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getApis = async (req, res) => {
  try {
    const apis = await Api.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(apis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateApi = async (req, res) => {
  try {
    const { name, baseUrl, description, status } = req.body;
    const api = await Api.findOneAndUpdate(
      { _id: req.params.apiId, owner: req.user.id },
      { name, baseUrl, description, status },
      { new: true }
    );
    if (!api) return res.status(404).json({ error: 'API not found' });
    res.json(api);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteApi = async (req, res) => {
  try {
    const api = await Api.findOneAndDelete({ _id: req.params.apiId, owner: req.user.id });
    if (!api) return res.status(404).json({ error: 'API not found' });
    
    // Delete all associated keys
    await ApiKey.deleteMany({ api: req.params.apiId });
    res.json({ message: 'API deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
