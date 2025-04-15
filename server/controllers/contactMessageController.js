const ContactMessage = require('../models/ContactMessage');
const { validationResult } = require('express-validator');
const mailService = require('../utils/mailService');

// Create a new contact message
exports.createContactMessage = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, subject, message } = req.body;
    
    // Create a new contact message
    const contactMessage = new ContactMessage({
      name,
      email,
      subject,
      message
    });

    await contactMessage.save();

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: contactMessage
    });
  } catch (error) {
    console.error('Error creating contact message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// Get all contact messages with pagination and filters
exports.getAllContactMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    
    // Build query based on filters
    const query = {};
    if (status) query.status = status;

    // Get total count for pagination
    const total = await ContactMessage.countDocuments(query);
    
    // Get messages with sorting and pagination
    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact messages',
      error: error.message
    });
  }
};

// Get a single contact message by ID
exports.getContactMessageById = async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    // If status is 'new', update to 'read'
    if (message.status === 'new') {
      message.status = 'read';
      message.readAt = new Date();
      await message.save();
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error fetching contact message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact message',
      error: error.message
    });
  }
};

// Update contact message status
exports.updateContactMessageStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['new', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const message = await ContactMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }
    
    message.status = status;
    
    // Update timestamps based on status
    if (status === 'read' && !message.readAt) {
      message.readAt = new Date();
    } else if (status === 'replied') {
      message.repliedAt = new Date();
    }
    
    await message.save();
    
    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: message
    });
  } catch (error) {
    console.error('Error updating contact message status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact message status',
      error: error.message
    });
  }
};

// Delete a contact message
exports.deleteContactMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }
    
    await message.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Contact message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact message',
      error: error.message
    });
  }
};

// Mark multiple messages as read, replied, or archived
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No message IDs provided'
      });
    }
    
    if (!['read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    // Update the timestamps based on status
    const updateData = { status };
    if (status === 'read') {
      updateData.readAt = new Date();
    } else if (status === 'replied') {
      updateData.repliedAt = new Date();
    }
    
    const result = await ContactMessage.updateMany(
      { _id: { $in: ids } },
      { $set: updateData }
    );
    
    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} messages updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating contact messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact messages',
      error: error.message
    });
  }
};

// Delete multiple contact messages
exports.bulkDeleteMessages = async (req, res) => {
  try {
    const { ids } = req.body;
    
    console.log('Bulk delete request received with payload:', req.body);
    
    if (!ids) {
      console.log('No ids provided in request body');
      return res.status(400).json({
        success: false,
        message: 'No message IDs provided in request body'
      });
    }
    
    if (!Array.isArray(ids)) {
      console.log('ids is not an array:', typeof ids);
      return res.status(400).json({
        success: false,
        message: 'ids must be an array of message IDs'
      });
    }
    
    if (ids.length === 0) {
      console.log('ids array is empty');
      return res.status(400).json({
        success: false,
        message: 'No message IDs provided (empty array)'
      });
    }
    
    console.log('Processing bulk delete for IDs:', ids);
    
    // Make sure we have a valid array of IDs
    const validIds = ids.filter(id => typeof id === 'string' && id.trim() !== '');
    
    if (validIds.length === 0) {
      console.log('No valid IDs found after filtering');
      return res.status(400).json({
        success: false,
        message: 'No valid message IDs provided after filtering'
      });
    }
    
    console.log('Attempting to delete messages with valid IDs:', validIds);
    
    try {
      const result = await ContactMessage.deleteMany({ _id: { $in: validIds } });
      
      console.log('Delete operation result:', result);
      
      res.status(200).json({
        success: true,
        message: `${result.deletedCount} message(s) deleted successfully`,
        deletedCount: result.deletedCount
      });
    } catch (dbError) {
      console.error('Database error during delete operation:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database error during delete operation',
        error: dbError.message
      });
    }
  } catch (error) {
    console.error('Error deleting contact messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact messages',
      error: error.message
    });
  }
};

// Send an email reply to a contact message
exports.sendEmailReply = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { replyContent } = req.body;
    
    if (!replyContent || replyContent.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required'
      });
    }
    
    // Find the contact message
    const message = await ContactMessage.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }
    
    // Send the email reply
    try {
      await mailService.sendContactReply({
        to: message.email,
        subject: `Re: ${message.subject}`,
        text: replyContent,
        name: message.name,
        replyToMessage: message.message
      });
      
      // Update the message status to replied
      message.status = 'replied';
      message.repliedAt = new Date();
      await message.save();
      
      res.status(200).json({
        success: true,
        message: 'Reply sent successfully'
      });
    } catch (emailError) {
      console.error('Error sending email reply:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send email reply',
        error: emailError.message || 'Email service error'
      });
    }
  } catch (error) {
    console.error('Error in send email reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process email reply',
      error: error.message
    });
  }
}; 