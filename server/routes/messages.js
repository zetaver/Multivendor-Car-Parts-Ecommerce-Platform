const express = require('express');
const {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead
} = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/conversations', authenticate, getConversations);
router.get('/conversations/:conversationId', authenticate, getMessages);
router.post('/conversations/:conversationId', authenticate, sendMessage);
router.put('/conversations/:conversationId/read', authenticate, markAsRead);

module.exports = router;

export default router