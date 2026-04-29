const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const UsageLog = require('../models/UsageLog');

class StripeService {
  constructor() {
    this.plans = {
      free: {
        name: 'Free',
        priceId: null, // No price for free plan
        requests: 5,
        features: ['Basic API access', '5 requests/month']
      },
      payg: {
        name: 'Pay As You Go',
        priceId: null, // No subscription for PAYG
        requests: 0, // No free tier, all requests are billable
        features: ['No monthly fee', 'Pay per request', 'Advanced analytics', 'Auto-recharge']
      },
      pro: {
        name: 'Pro',
        priceId: process.env.STRIPE_PRO_PRICE_ID,
        requests: 10000,
        features: ['Advanced API access', '10,000 requests/month', 'Priority support']
      },
      enterprise: {
        name: 'Enterprise',
        priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
        requests: 100000,
        features: ['Unlimited API access', '100,000 requests/month', 'Dedicated support', 'Custom integrations']
      }
    };
  }

  async createCustomer(userId, email) {
    try {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId }
      });

      // Create free subscription for new users
      await Subscription.create({
        user: userId,
        stripeCustomerId: customer.id,
        plan: 'free',
        status: 'active'
      });

      return customer;
    } catch (error) {
      throw new Error(`Failed to create Stripe customer: ${error.message}`);
    }
  }

  async createSubscription(userId, plan) {
    try {
      const subscription = await Subscription.findOne({ user: userId });
      
      if (!subscription || !subscription.stripeCustomerId) {
        throw new Error('Customer not found');
      }

      const priceId = this.plans[plan]?.priceId;
      if (!priceId) {
        throw new Error('Invalid plan selected');
      }

      const stripeSubscription = await stripe.subscriptions.create({
        customer: subscription.stripeCustomerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update subscription in database
      await Subscription.findByIdAndUpdate(subscription._id, {
        stripeSubscriptionId: stripeSubscription.id,
        plan,
        status: 'active',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
      });

      return stripeSubscription;
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  async cancelSubscription(userId) {
    try {
      const subscription = await Subscription.findOne({ user: userId });
      
      if (!subscription?.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      const canceledSubscription = await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

      // Update subscription in database
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: 'canceled',
        cancelAtPeriodEnd: true
      });

      return canceledSubscription;
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  async generateInvoice(userId) {
    try {
      const subscription = await Subscription.findOne({ user: userId });
      const now = new Date();
      const periodStart = subscription.currentPeriodStart || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const periodEnd = subscription.currentPeriodEnd || now;

      // Calculate usage
      const usage = await this.calculateUsage(userId, periodStart, periodEnd);
      const plan = this.plans[subscription.plan];
      
      let amount = 0;
      let ratePerRequest = 0;

      if (subscription.plan === 'pro') {
        // Pro plan: $29/month + $0.01 per request over 10,000
        amount = 2900; // $29 in cents
        if (usage.totalRequests > plan.requests) {
          const extraRequests = usage.totalRequests - plan.requests;
          ratePerRequest = 1; // $0.01 in cents
          amount += extraRequests * ratePerRequest;
        }
      } else if (subscription.plan === 'enterprise') {
        // Enterprise plan: $99/month + $0.005 per request over 100,000
        amount = 9900; // $99 in cents
        if (usage.totalRequests > plan.requests) {
          const extraRequests = usage.totalRequests - plan.requests;
          ratePerRequest = 0.5; // $0.005 in cents
          amount += extraRequests * ratePerRequest;
        }
      }

      // Create Stripe invoice
      const invoice = await stripe.invoices.create({
        customer: subscription.stripeCustomerId,
        subscription: subscription.stripeSubscriptionId,
        period_start: Math.floor(periodStart.getTime() / 1000),
        period_end: Math.floor(periodEnd.getTime() / 1000),
        currency: 'usd',
        metadata: {
          userId,
          totalRequests: usage.totalRequests.toString()
        }
      });

      // Add invoice item for usage charges
      if (amount > 0) {
        await stripe.invoiceItems.create({
          customer: subscription.stripeCustomerId,
          amount,
          currency: 'usd',
          description: `API Usage: ${usage.totalRequests} requests`,
          invoice: invoice.id
        });
      }

      // Finalize invoice
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

      // Save invoice to database
      await Invoice.create({
        user: userId,
        subscription: subscription._id,
        stripeInvoiceId: finalizedInvoice.id,
        amount: finalizedInvoice.total,
        currency: finalizedInvoice.currency,
        status: finalizedInvoice.status,
        periodStart,
        periodEnd,
        usage: {
          totalRequests: usage.totalRequests,
          ratePerRequest,
          baseFee: subscription.plan !== 'free' ? (subscription.plan === 'pro' ? 2900 : 9900) : 0
        }
      });

      return finalizedInvoice;
    } catch (error) {
      throw new Error(`Failed to generate invoice: ${error.message}`);
    }
  }

  async calculateUsage(userId, periodStart, periodEnd) {
    try {
      const usage = await UsageLog.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            timestamp: { $gte: periodStart, $lte: periodEnd }
          }
        },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            avgLatency: { $avg: '$latency' },
            successRate: {
              $avg: { $cond: [{ $lt: ['$status', 400] }, 1, 0] }
            }
          }
        }
      ]);

      return {
        totalRequests: usage[0]?.totalRequests || 0,
        avgLatency: usage[0]?.avgLatency || 0,
        successRate: usage[0]?.successRate || 0
      };
    } catch (error) {
      throw new Error(`Failed to calculate usage: ${error.message}`);
    }
  }

  async handleWebhook(event) {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }
  }

  async handlePaymentSucceeded(invoice) {
    try {
      await Invoice.findOneAndUpdate(
        { stripeInvoiceId: invoice.id },
        { 
          status: 'paid',
          paidAt: new Date(invoice.status_transitions.paid_at * 1000)
        }
      );

      const userId = invoice.metadata.userId;
      if (userId) {
        await Subscription.findOneAndUpdate(
          { user: userId },
          { status: 'active' }
        );
      }
    } catch (error) {
      console.error('Error handling payment succeeded:', error);
    }
  }

  async handlePaymentFailed(invoice) {
    try {
      await Invoice.findOneAndUpdate(
        { stripeInvoiceId: invoice.id },
        { status: 'open' }
      );

      const userId = invoice.metadata.userId;
      if (userId) {
        await Subscription.findOneAndUpdate(
          { user: userId },
          { status: 'past_due' }
        );
      }
    } catch (error) {
      console.error('Error handling payment failed:', error);
    }
  }

  async handleSubscriptionDeleted(subscription) {
    try {
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        { 
          status: 'canceled',
          cancelAtPeriodEnd: true
        }
      );
    } catch (error) {
      console.error('Error handling subscription deleted:', error);
    }
  }
}

module.exports = new StripeService();
