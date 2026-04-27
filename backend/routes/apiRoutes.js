const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const auth = require('../middleware/auth');

// API Management
router.post('/create-api', auth, apiController.createApi);
router.get('/list-apis', auth, apiController.getApis);
router.put('/update-api/:apiId', auth, apiController.updateApi);
router.delete('/delete-api/:apiId', auth, apiController.deleteApi);

// API Key Management
router.post('/keys/generate-key', auth, (req, res) => {
  console.log('🔑 Generate-key route hit:', req.method, req.url);
  console.log('📋 Request body:', req.body);
  console.log('📋 Request headers:', req.headers);
  console.log('👤 User:', req.user);
  apiController.generateKey(req, res);
});
router.get('/keys', auth, (req, res) => {
  console.log('📋 Get-keys route hit:', req.method, req.url);
  apiController.getKeys(req, res);
});
router.put('/keys/revoke-key/:keyId', auth, (req, res) => {
  console.log('🗑️ Revoke-key route hit:', req.method, req.url, req.params.keyId);
  apiController.revokeKey(req, res);
});

module.exports = router;
