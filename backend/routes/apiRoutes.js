const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const auth = require('../middleware/auth');

router.post('/create', auth, apiController.createApi);
router.post('/keys/generate', auth, apiController.generateKey);
router.get('/keys', auth, apiController.getKeys);
router.put('/keys/revoke/:keyId', auth, apiController.revokeKey);

module.exports = router;
