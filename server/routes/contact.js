const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const contactMessageController = require('../controllers/contactMessageController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');

// Validation middleware for contact message creation
const validateContactMessage = [
  check('name').trim().notEmpty().withMessage('Name is required'),
  check('email').trim().isEmail().withMessage('Valid email is required'),
  check('subject').trim().notEmpty().withMessage('Subject is required'),
  check('message').trim().notEmpty().withMessage('Message is required')
];

// Validation middleware for reply content
const validateReplyContent = [
  check('replyContent').trim().notEmpty().withMessage('Reply content is required')
];

// Public route - Create a contact message
router.post(
  '/messages', 
  validateContactMessage,
  contactMessageController.createContactMessage
);

// Admin routes - Get, update, delete messages
// Get all contact messages with pagination and filtering
router.get(
  '/messages',
  authenticate,
  isAdmin,
  contactMessageController.getAllContactMessages
);

// IMPORTANT: Bulk routes come BEFORE individual ID routes to prevent route conflicts
// Bulk update status (mark multiple as read/replied/archived)
router.patch(
  '/messages/bulk/status',
  authenticate,
  isAdmin,
  contactMessageController.bulkUpdateStatus
);

// Bulk delete messages
router.delete(
  '/messages/bulk',
  authenticate,
  isAdmin,
  contactMessageController.bulkDeleteMessages
);

// Send email reply to a contact message
router.post(
  '/messages/:messageId/reply',
  authenticate,
  isAdmin,
  validateReplyContent,
  contactMessageController.sendEmailReply
);

// Get a single contact message
router.get(
  '/messages/:id',
  authenticate,
  isAdmin,
  contactMessageController.getContactMessageById
);

// Update a contact message status
router.patch(
  '/messages/:id/status',
  authenticate,
  isAdmin,
  contactMessageController.updateContactMessageStatus
);

// Delete a contact message
router.delete(
  '/messages/:id',
  authenticate,
  isAdmin,
  contactMessageController.deleteContactMessage
);

module.exports = router; 