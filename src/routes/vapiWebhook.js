const express = require('express');
const router = express.Router();
const { handleCallOutcome } = require('../controllers/callController');
const { markCallFinished } = require('../utils/callQueue');

router.post('/', async (req, res) => {
  const message = req.body?.message || req.body || {};
  const type = message.type;

  const meaningful = ['end-of-call-report', 'status-update'];
  if (meaningful.includes(type)) console.log(`[vapi-webhook] type=${type}`);

  if (type === 'end-of-call-report') {
    const artifact = message.artifact || {};
    const so = artifact.structuredOutputs;
    console.log('[vapi-webhook DEBUG] artifact.structuredOutputs present?', !!so, 'keys:', so ? Object.keys(so) : 'none');
    if (so && Object.keys(so).length) {
      console.log('[vapi-webhook DEBUG] SO result:', JSON.stringify(Object.values(so)[0]?.result));
    }
  }

  if (type === 'status-update') {
    const status = message.status || message.call?.status;
    if (status) console.log(`[vapi-webhook] call status: ${status}`);
    return res.status(200).json({ ok: true });
  }

  if (type !== 'end-of-call-report') {
    return res.status(200).json({ ok: true, ignored: type });
  }

  res.status(200).json({ ok: true });

  const callId = message.call?.id || message.callId;
  if (callId) {
    markCallFinished(callId, message.endedReason || 'ended');
  }

  try {
    await handleCallOutcome(message);
  } catch (err) {
    console.error('[vapi-webhook] outcome error:', err.response?.data || err.message);
  }
});

module.exports = router;
