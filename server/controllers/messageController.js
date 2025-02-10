const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { createError } = require('../utils/error');

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
      isActive: true
    })
    .populate('participants', 'name avatar')
    .populate('lastMessage')
    .populate('product', 'title images')
    .sort('-updatedAt');

    res.json(conversations);
  } catch (error) {
    res.status(500).json(createError('Error fetching conversations'));
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json(createError('Conversation not found'));
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json(createError('Not authorized'));
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name avatar')
      .sort('createdAt');

    res.json(messages);
  } catch (error) {
    res.status(500).json(createError('Error fetching messages'));
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json(createError('Conversation not found'));
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json(createError('Not authorized'));
    }

    // Create message
    const message = new Message({
      conversation: conversationId,
      sender: req.user.id,
      receiver: conversation.participants.find(p => p.toString() !== req.user.id),
      content
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    await conversation.save();

    // Populate sender details
    await message.populate('sender', 'name avatar');

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json(createError('Error sending message'));
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: req.user.id,
        isRead: false
      },
      { isRead: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json(createError('Error marking messages as read'));
  }
};