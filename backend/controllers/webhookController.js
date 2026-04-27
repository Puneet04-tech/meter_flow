const webhookService = require('../services/webhookService');

exports.createWebhook = async (req, res) => {
  try {
    const { url, events } = req.body;
    
    if (!url || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'URL and events array are required' });
    }

    const webhook = await webhookService.createWebhook(req.user.id, url, events);
    res.status(201).json(webhook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWebhooks = async (req, res) => {
  try {
    const webhooks = await webhookService.getUserWebhooks(req.user.id);
    res.json(webhooks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    await webhookService.deleteWebhook(req.user.id, id);
    res.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const webhook = await webhookService.updateWebhook(req.user.id, id, updates);
    res.json(webhook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.testWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Send a test event
    await webhookService.triggerWebhook(req.user.id, 'test.event', {
      message: 'This is a test webhook from MeterFlow',
      timestamp: new Date().toISOString()
    });
    
    res.json({ message: 'Test webhook sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
