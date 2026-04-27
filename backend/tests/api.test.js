const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Api = require('../models/Api');
const ApiKey = require('../models/ApiKey');
const jwt = require('jsonwebtoken');

describe('API Management', () => {
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

  describe('POST /api/mems/create', () => {
    it('should create a new API', async () => {
      const apiData = {
        name: 'Test API',
        baseUrl: 'https://api.example.com',
        description: 'Test API description'
      };

      const response = await request(app)
        .post('/api/mems/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(apiData)
        .expect(201);

      expect(response.body.name).toBe(apiData.name);
      expect(response.body.baseUrl).toBe(apiData.baseUrl);
      expect(response.body.owner.toString()).toBe(userId.toString());
    });

    it('should require authentication', async () => {
      const apiData = {
        name: 'Test API',
        baseUrl: 'https://api.example.com'
      };

      await request(app)
        .post('/api/mems/create')
        .send(apiData)
        .expect(401);
    });
  });

  describe('POST /api/mems/generate-key', () => {
    beforeEach(async () => {
      const api = new Api({
        owner: userId,
        name: 'Test API',
        baseUrl: 'https://api.example.com'
      });
      await api.save();
    });

    it('should generate an API key', async () => {
      const keyData = {
        name: 'Test Key'
      };

      const response = await request(app)
        .post('/api/mems/generate-key')
        .set('Authorization', `Bearer ${authToken}`)
        .send(keyData)
        .expect(201);

      expect(response.body.key).toMatch(/^mf_[a-f0-9]{48}$/);
      expect(response.body.name).toBe(keyData.name);
      expect(response.body.status).toBe('active');
    });

    it('should generate key for specific API', async () => {
      const api = await Api.findOne({ owner: userId });
      const keyData = {
        apiId: api._id,
        name: 'Test Key'
      };

      const response = await request(app)
        .post('/api/mems/generate-key')
        .set('Authorization', `Bearer ${authToken}`)
        .send(keyData)
        .expect(201);

      expect(response.body.key).toBeDefined();
      expect(response.body.name).toBe(keyData.name);
    });
  });

  describe('GET /api/mems/keys', () => {
    beforeEach(async () => {
      const api = new Api({
        owner: userId,
        name: 'Test API',
        baseUrl: 'https://api.example.com'
      });
      await api.save();

      const apiKey = new ApiKey({
        key: 'mf_test_key_12345',
        user: userId,
        api: api._id,
        name: 'Test Key'
      });
      await apiKey.save();
    });

    it('should get user\'s API keys', async () => {
      const response = await request(app)
        .get('/api/mems/keys')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Test Key');
    });
  });

  describe('PUT /api/mems/revoke-key/:keyId', () => {
    let keyId;

    beforeEach(async () => {
      const api = new Api({
        owner: userId,
        name: 'Test API',
        baseUrl: 'https://api.example.com'
      });
      await api.save();

      const apiKey = new ApiKey({
        key: 'mf_test_key_12345',
        user: userId,
        api: api._id,
        name: 'Test Key'
      });
      await apiKey.save();
      keyId = apiKey._id;
    });

    it('should revoke an API key', async () => {
      const response = await request(app)
        .put(`/api/mems/revoke-key/${keyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('API Key revoked successfully');

      // Verify key is revoked
      const revokedKey = await ApiKey.findById(keyId);
      expect(revokedKey.status).toBe('revoked');
    });

    it('should not revoke non-existent key', async () => {
      const fakeKeyId = new mongoose.Types.ObjectId();
      
      await request(app)
        .put(`/api/mems/revoke-key/${fakeKeyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
