const crypto = require('crypto');
const axios = require('axios');
const Webhook = require('../models/Webhook');
const UsageLog = require('../models/UsageLog');

class WebhookService {
  constructor() {
    this.events = {
      INVOICE_CREATED: 'invoice.created',
      INVOICE_PAID: 'invoice.paid',
      INVOICE_FAILED: 'invoice.payment_failed',
      USAGE_LIMIT_REACHED: 'usage.limit_reached',
      USAGE_WARNING: 'usage.warning',
      API_KEY_REVOKED: 'api_key.revoked',
      API_KEY_CREATED: 'api_key.created',
      SUBSCRIPTION_CREATED: 'subscription.created',
      SUBSCRIPTION_CANCELLED: 'subscription.cancelled'
    };
  }

  async createWebhook(userId, url, events) {
    try {
      const secret = crypto.randomBytes(32).toString('hex');
      
      const webhook = new Webhook({
        user: userId,
        url,
        events,
        secret
      });
      
      await webhook.save();
      return webhook;
    } catch (error) {
      throw new Error(`Failed to create webhook: ${error.message}`);
    }
  }

  async triggerWebhook(userId, eventType, data) {
    try {
      const webhooks = await Webhook.find({
        user: userId,
        active: true,
        events: eventType
      });

      const payload = {
        event: eventType,
        data,
        timestamp: new Date().toISOString()
      };

      const promises = webhooks.map(webhook => 
        this.sendWebhook(webhook, payload)
      );

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Webhook trigger error:', error);
    }
  }

  async sendWebhook(webhook, payload) {
    try {
      const signature = this.generateSignature(webhook.secret, JSON.stringify(payload));
      
      await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-MeterFlow-Signature': signature,
          'X-MeterFlow-Event': payload.event
        },
        timeout: 5000
      });

      // Update last triggered
      webhook.lastTriggered = new Date();
      await webhook.save();
      
    } catch (error) {
      console.error(`Webhook delivery failed to ${webhook.url}:`, error.message);
      
      // Deactivate webhook after multiple failures
      if (error.response?.status >= 400) {
        webhook.active = false;
        await webhook.save();
      }
    }
  }

  generateSignature(secret, payload) {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  async checkUsageLimits(userId) {
    try {
      const subscription = await require('../models/Subscription').findOne({ user: userId });
      if (!subscription) return;

      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const usageCount = await UsageLog.countDocuments({
        userId,
        timestamp: { $gte: currentMonth }
      });

      const planLimits = {
        free: 1000,
        pro: 10000,
        enterprise: 100000
      };

      const limit = planLimits[subscription.plan] || 1000;
      const warningThreshold = limit * 0.8; // 80% warning

      // Check if limit reached
      if (usageCount >= limit) {
        await this.triggerWebhook(userId, this.events.USAGE_LIMIT_REACHED, {
          usage: usageCount,
          limit,
          plan: subscription.plan
        });
      }
      // Check if warning threshold reached
      else if (usageCount >= warningThreshold) {
        await this.triggerWebhook(userId, this.events.USAGE_WARNING, {
          usage: usageCount,
          limit,
          warningThreshold,
          plan: subscription.plan,
          percentageUsed: Math.round((usageCount / limit) * 100)
        });
      }
    } catch (error) {
      console.error('Usage limit check error:', error);
    }
  }

  async verifyWebhookSignature(secret, payload, signature) {
    const expectedSignature = this.generateSignature(secret, payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  async getUserWebhooks(userId) {
    try {
      return await Webhook.find({ user: userId }).select('-secret');
    } catch (error) {
      throw new Error(`Failed to get webhooks: ${error.message}`);
    }
  }

  async deleteWebhook(userId, webhookId) {
    try {
      const result = await Webhook.findOneAndDelete({
        _id: webhookId,
        user: userId
      });
      
      if (!result) {
        throw new Error('Webhook not found');
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }
  }

  async updateWebhook(userId, webhookId, updates) {
    try {
      const webhook = await Webhook.findOneAndUpdate(
        { _id: webhookId, user: userId },
        updates,
        { new: true }
      ).select('-secret');
      
      if (!webhook) {
        throw new Error('Webhook not found');
      }
      
      return webhook;
    } catch (error) {
      throw new Error(`Failed to update webhook: ${error.message}`);
    }
  }
}

module.exports = new WebhookService();
