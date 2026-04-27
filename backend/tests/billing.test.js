const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const UsageLog = require('../models/UsageLog');
const jwt = require('jsonwebtoken');

describe('Billing System', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();
    
    userId = user._id;
    authToken = jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET || 'test-secret');
  });

  describe('GET /api/billing/calculate', () => {
    beforeEach(async () => {
      // Create usage logs
      const usageLogs = Array(1500).fill(null).map((_, i) => ({
        apiKey: 'mf_test_key',
        userId,
        apiId: new mongoose.Types.ObjectId(),
        endpoint: '/test',
        method: 'GET',
        status: 200,
        latency: 100,
        timestamp: new Date()
      }));
      
      await UsageLog.insertMany(usageLogs);
    });

    it('should calculate billing for free plan', async () => {
      const response = await request(app)
        .get('/api/billing/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.plan).toBe('free');
      expect(response.body.totalRequests).toBe(1500);
      expect(response.body.billableRequests).toBe(500);
      expect(parseFloat(response.body.amount)).toBeGreaterThan(0);
    });
  });

  describe('GET /api/billing/stats', () => {
    beforeEach(async () => {
      // Create usage logs with different dates
      const dates = [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        new Date('2024-01-03')
      ];

      const usageLogs = dates.map(date => ({
        apiKey: 'mf_test_key',
        userId,
        apiId: new mongoose.Types.ObjectId(),
        endpoint: '/test',
        method: 'GET',
        status: 200,
        latency: 100,
        timestamp: date
      }));
      
      await UsageLog.insertMany(usageLogs);
    });

    it('should get usage stats', async () => {
      const response = await request(app)
        .get('/api/billing/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/billing/subscription', () => {
    beforeEach(async () => {
      const subscription = new Subscription({
        user: userId,
        stripeCustomerId: 'cus_test123',
        plan: 'free',
        status: 'active'
      });
      await subscription.save();
    });

    it('should get user subscription', async () => {
      const response = await request(app)
        .get('/api/billing/subscription')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.plan).toBe('free');
      expect(response.body.status).toBe('active');
      expect(response.body.stripeCustomerId).toBe('cus_test123');
    });

    it('should return 404 for non-existent subscription', async () => {
      // Delete the subscription
      await Subscription.deleteOne({ user: userId });

      await request(app)
        .get('/api/billing/subscription')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/billing/invoices', () => {
    beforeEach(async () => {
      const invoice = new Invoice({
        user: userId,
        stripeInvoiceId: 'in_test123',
        amount: 2900,
        currency: 'usd',
        status: 'paid',
        periodStart: new Date(),
        periodEnd: new Date(),
        usage: {
          totalRequests: 1000,
          ratePerRequest: 1,
          baseFee: 2900
        }
      });
      await invoice.save();
    });

    it('should get user invoices', async () => {
      const response = await request(app)
        .get('/api/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].stripeInvoiceId).toBe('in_test123');
      expect(response.body[0].amount).toBe(2900);
    });
  });

  describe('GET /api/billing/profile', () => {
    it('should get user profile with stats', async () => {
      const response = await request(app)
        .get('/api/billing/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.email).toBe('test@example.com');
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalRequests).toBe(0);
      expect(response.body.stats.apiCount).toBe(0);
      expect(response.body.stats.keyCount).toBe(0);
    });
  });
});
