const express = require('express');
const router = express.Router();
const { triggerCallForContact } = require('../controllers/callController');
const { enqueue, getStatus } = require('../utils/callQueue');

router.post('/', async (req, res) => {
  const body = req.body || {};
  const contactId = body.contact_id || body.contactId || body.id || body.contact?.id;

  console.log('[ghl-webhook] received', JSON.stringify(body).slice(0, 500));

  if (!contactId) {
    return res.status(400).json({ error: 'missing contactId' });
  }

  enqueue(contactId, () => triggerCallForContact(contactId));
  res.status(202).json({ accepted: true, contactId, queue: getStatus() });
});

router.get('/status', (req, res) => {
  res.json(getStatus());
});

module.exports = router;
