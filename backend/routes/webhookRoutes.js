const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const auth = require('../middleware/auth');

router.post('/', auth, webhookController.createWebhook);
router.get('/', auth, webhookController.getWebhooks);
router.put('/:id', auth, webhookController.updateWebhook);
router.delete('/:id', auth, webhookController.deleteWebhook);
router.post('/:id/test', auth, webhookController.testWebhook);

module.exports = router;
