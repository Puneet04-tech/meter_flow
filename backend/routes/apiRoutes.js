const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const auth = require('../middleware/auth');

// API Management
router.post('/create', auth, apiController.createApi);
router.get('/list', auth, apiController.getApis);
router.put('/:apiId', auth, apiController.updateApi);
router.delete('/:apiId', auth, apiController.deleteApi);

// API Key Management
router.post('/keys/generate', auth, apiController.generateKey);
router.get('/keys', auth, apiController.getKeys);
router.put('/keys/revoke/:keyId', auth, apiController.revokeKey);

module.exports = router;
