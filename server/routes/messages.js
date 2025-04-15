const express = require('express');
const {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  createConversation,
  deleteMessage,
  getUnreadCount,
  archiveConversation,
  restoreConversation,
  getConversationById,
  deleteConversation,
  updateOfferStatus
} = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Conversation routes
router.get('/conversations', authenticate, getConversations);
router.post('/conversations', authenticate, createConversation);
router.get('/conversations/:conversationId', authenticate, getMessages);
router.get('/conversations/:conversationId/info', authenticate, getConversationById);
router.post('/conversations/:conversationId', authenticate, sendMessage);
router.put('/conversations/:conversationId/read', authenticate, markAsRead);
router.post('/conversations/:conversationId/archive', authenticate, archiveConversation);
router.post('/conversations/:conversationId/restore', authenticate, restoreConversation);
router.delete('/conversations/:conversationId', authenticate, deleteConversation);

// Offer related routes
router.post('/conversations/:conversationId/offer-status', authenticate, updateOfferStatus);

// Message routes
router.delete('/messages/:messageId', authenticate, deleteMessage);

// Utility routes
router.get('/unread-count', authenticate, getUnreadCount);

module.exports = router;