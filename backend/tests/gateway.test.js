const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Api = require('../models/Api');
const ApiKey = require('../models/ApiKey');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Mock axios to avoid actual HTTP calls
jest.mock('axios');
const mockedAxios = axios;

describe('API Gateway', () => {
  let authToken;
  let userId;
  let api;
  let apiKey;

  beforeEach(async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();
    
    userId = user._id;
    authToken = jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET || 'test-secret');

    api = new Api({
      owner: userId,
      name: 'Test API',
      baseUrl: 'https://api.example.com'
    });
    await api.save();

    apiKey = new ApiKey({
      key: 'mf_test_key_12345',
      user: userId,
      api: api._id,
      name: 'Test Key'
    });
    await apiKey.save();
  });

  describe('Gateway Requests', () => {
    it('should forward valid request with API key', async () => {
      // Mock successful API response
      mockedAxios.mockResolvedValueOnce({
        status: 200,
        data: { message: 'Success' }
      });

      const response = await request(app)
        .get(`/gateway/${api._id}/test-endpoint`)
        .set('x-api-key', 'mf_test_key_12345')
        .expect(200);

      expect(response.body.message).toBe('Success');
      
      // Verify usage log was created
      const UsageLog = require('../models/UsageLog');
      const usageLog = await UsageLog.findOne({ apiKey: 'mf_test_key_12345' });
      expect(usageLog).toBeDefined();
      expect(usageLog.endpoint).toContain('test-endpoint');
      expect(usageLog.method).toBe('GET');
      expect(usageLog.status).toBe(200);
    });

    it('should reject request without API key', async () => {
      const response = await request(app)
        .get(`/gateway/${api._id}/test-endpoint`)
        .expect(401);

      expect(response.body.error).toBe('API Key is missing');
    });

    it('should reject request with invalid API key', async () => {
      const response = await request(app)
        .get(`/gateway/${api._id}/test-endpoint`)
        .set('x-api-key', 'invalid_key')
        .expect(403);

      expect(response.body.error).toBe('Invalid or revoked API Key');
    });

    it('should reject request with revoked API key', async () => {
      // Revoke the API key
      await ApiKey.findByIdAndUpdate(apiKey._id, { status: 'revoked' });

      const response = await request(app)
        .get(`/gateway/${api._id}/test-endpoint`)
        .set('x-api-key', 'mf_test_key_12345')
        .expect(403);

      expect(response.body.error).toBe('Invalid or revoked API Key');
    });

    it('should handle different HTTP methods', async () => {
      // Mock POST response
      mockedAxios.mockResolvedValueOnce({
        status: 201,
        data: { id: 123, name: 'Test Resource' }
      });

      const response = await request(app)
        .post(`/gateway/${api._id}/resources`)
        .set('x-api-key', 'mf_test_key_12345')
        .send({ name: 'Test Resource' })
        .expect(201);

      expect(response.body.name).toBe('Test Resource');
      
      // Verify usage log
      const UsageLog = require('../models/UsageLog');
      const usageLog = await UsageLog.findOne({ apiKey: 'mf_test_key_12345' });
      expect(usageLog.method).toBe('POST');
      expect(usageLog.status).toBe(201);
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockedAxios.mockResolvedValueOnce({
        status: 500,
        data: { error: 'Internal Server Error' }
      });

      const response = await request(app)
        .get(`/gateway/${api._id}/error-endpoint`)
        .set('x-api-key', 'mf_test_key_12345')
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');
      
      // Verify error was logged
      const UsageLog = require('../models/UsageLog');
      const usageLog = await UsageLog.findOne({ apiKey: 'mf_test_key_12345' });
      expect(usageLog.status).toBe(500);
    });

    it('should handle network errors', async () => {
      // Mock network error
      mockedAxios.mockRejectedValueOnce(new Error('Network Error'));

      const response = await request(app)
        .get(`/gateway/${api._id}/network-error`)
        .set('x-api-key', 'mf_test_key_12345')
        .expect(502);

      expect(response.body.error).toBe('Bad Gateway - Could not reach target API');
    });

    it('should measure and log latency', async () => {
      // Mock response with delay
      mockedAxios.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            status: 200,
            data: { message: 'Success' }
          }), 100)
        )
      );

      await request(app)
        .get(`/gateway/${api._id}/test-endpoint`)
        .set('x-api-key', 'mf_test_key_12345')
        .expect(200);

      // Verify latency was measured
      const UsageLog = require('../models/UsageLog');
      const usageLog = await UsageLog.findOne({ apiKey: 'mf_test_key_12345' });
      expect(usageLog.latency).toBeGreaterThan(0);
      expect(usageLog.latency).toBeLessThan(1000); // Should be reasonable
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      // Mock successful response
      mockedAxios.mockResolvedValue({
        status: 200,
        data: { message: 'Success' }
      });

      // Make multiple requests within limit
      for (let i = 0; i < 10; i++) {
        await request(app)
          .get(`/gateway/${api._id}/test-endpoint`)
          .set('x-api-key', 'mf_test_key_12345')
          .expect(200);
      }
    });

    // Note: Testing actual rate limiting would require Redis setup
    // This test would need to be adjusted for the test environment
  });
});
