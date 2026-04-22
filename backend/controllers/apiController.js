const crypto = require('crypto');
const ApiKey = require('../models/ApiKey');
const Api = require('../models/Api');

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
  try {
    const { apiId, name } = req.body;
    const userId = req.user.id;

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
    res.status(201).json({ _id: apiKey._id, name: apiKey.name, key, status: 'active', createdAt: apiKey.createdAt });
  } catch (error) {
    console.error('Generate key error:', error);
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
    res.json({ message: 'API Key revoked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find({ user: req.user.id }).populate('api', 'name');
    res.json(keys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
