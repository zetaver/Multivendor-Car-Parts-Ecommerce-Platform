const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { createError } = require('../utils/error');
const Product = require('../models/Product');

// Get all conversations for a user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { archived = false } = req.query;
    
    // Convert archived string to boolean
    const isArchived = archived === 'true' || archived === true;
    
    // Build query based on archived status
    let query = {
      participants: userId,
    };
    
    // Handle both old and new field names for backward compatibility
    if (isArchived) {
      // Find conversations that are archived (either isArchived=true or isActive=false)
      query.$or = [
        { isArchived: true },
        { isActive: false }
      ];
    } else {
      // Find conversations that are not archived (either isArchived=false or isActive=true or isActive is undefined)
      query.$or = [
        { isArchived: false },
        { isActive: true },
        { isActive: { $exists: false }, isArchived: { $exists: false } }
      ];
    }
    
    // Find conversations where user is a participant and match archived status
    const conversations = await Conversation.find(query)
      .populate({
        path: 'participants',
        select: '_id name firstName lastName email avatar'
      })
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: '_id name firstName lastName email avatar'
        }
      })
      .populate({
        path: 'product',
        select: '_id title images price'
      })
      .sort({ updatedAt: -1 });
    
    // Get unread messages count for each conversation
    const conversationsWithUnreadCount = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          receiver: userId,
          isRead: false
        });
        
        return {
          ...conversation.toObject(),
          unreadCount
        };
      })
    );
    
    res.status(200).json(conversationsWithUnreadCount);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new conversation
exports.createConversation = async (req, res) => {
  try {
    const { participantId, productId, initialMessage } = req.body;
    
    // If productId is provided, we'll create a conversation with the product's seller
    if (productId) {
      // Find the product to get the seller
      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(404).json(createError('Product not found'));
      }
      
      // Get the seller ID from the product
      const sellerId = product.seller.toString();
      
      // Check if conversation already exists between these users for this product
      const existingConversation = await Conversation.findOne({
        participants: { $all: [req.user.id, sellerId] },
        product: productId
      });
      
      if (existingConversation) {
        // If conversation exists, return it with populated fields
        const conversation = await Conversation.findById(existingConversation._id)
          .populate('participants', 'name avatar email firstName lastName')
          .populate({
            path: 'lastMessage',
            populate: {
              path: 'sender',
              select: 'name avatar email firstName lastName'
            }
          })
          .populate('product', 'title images price');
        
        return res.json(conversation);
      }
      
      // Create new conversation with the seller
      const newConversation = new Conversation({
        participants: [req.user.id, sellerId],
        product: productId
      });
      
      await newConversation.save();
      
      // If initial message is provided, create it
      if (initialMessage) {
        const message = new Message({
          conversation: newConversation._id,
          sender: req.user.id,
          receiver: sellerId,
          content: initialMessage
        });
        
        await message.save();
        
        // Update conversation with last message
        newConversation.lastMessage = message._id;
        await newConversation.save();
      }
      
      // Return populated conversation
      const populatedConversation = await Conversation.findById(newConversation._id)
        .populate('participants', 'name avatar email firstName lastName')
        .populate({
          path: 'lastMessage',
          populate: {
            path: 'sender',
            select: 'name avatar email firstName lastName'
          }
        })
        .populate('product', 'title images price');
      
      return res.status(201).json(populatedConversation);
    }
    
    // If no productId is provided, proceed with regular conversation creation using participantId
    if (!participantId) {
      return res.status(400).json(createError('Participant ID is required when product ID is not provided'));
    }
    
    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json(createError('User not found'));
    }
    
    // Check if conversation already exists between these users
    const existingConversation = await Conversation.findOne({
      participants: { $all: [req.user.id, participantId] },
      product: null // Ensure no product is associated for direct conversations
    });
    
    if (existingConversation) {
      // If conversation exists, return it with populated fields
      const conversation = await Conversation.findById(existingConversation._id)
        .populate('participants', 'name avatar email firstName lastName')
        .populate({
          path: 'lastMessage',
          populate: {
            path: 'sender',
            select: 'name avatar email firstName lastName'
          }
        });
      
      return res.json(conversation);
    }
    
    // Create new conversation for direct messaging (no product)
    const newConversation = new Conversation({
      participants: [req.user.id, participantId],
      product: null
    });
    
    await newConversation.save();
    
    // If initial message is provided, create it
    if (initialMessage) {
      const message = new Message({
        conversation: newConversation._id,
        sender: req.user.id,
        receiver: participantId,
        content: initialMessage
      });
      
      await message.save();
      
      // Update conversation with last message
      newConversation.lastMessage = message._id;
      await newConversation.save();
    }
    
    // Return populated conversation
    const populatedConversation = await Conversation.findById(newConversation._id)
      .populate('participants', 'name avatar email firstName lastName')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name avatar email firstName lastName'
        }
      });
    
    res.status(201).json(populatedConversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json(createError('Error creating conversation'));
  }
};

// Get messages for a specific conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json(createError('Conversation not found'));
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json(createError('Not authorized to access this conversation'));
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination
    const totalMessages = await Message.countDocuments({ conversation: conversationId });
    
    // Get messages with pagination
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name avatar email firstName lastName')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    
    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: req.user.id,
        isRead: false
      },
      { isRead: true }
    );

    res.json({
      messages: messages.reverse(), // Reverse to get chronological order
      pagination: {
        total: totalMessages,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalMessages / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json(createError('Error fetching messages'));
  }
};

// Send a message in a conversation
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json(createError('Message content is required'));
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json(createError('Conversation not found'));
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json(createError('Not authorized to send messages in this conversation'));
    }
    
    // Find the receiver (the other participant)
    const receiver = conversation.participants.find(
      p => p.toString() !== req.user.id
    );

    // Create message
    const message = new Message({
      conversation: conversationId,
      sender: req.user.id,
      receiver,
      content: content.trim()
    });

    await message.save();

    // Update conversation's last message and timestamp
    conversation.lastMessage = message._id;
    await conversation.save();

    // Populate sender details
    await message.populate('sender', 'name avatar email firstName lastName');

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json(createError('Error sending message'));
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json(createError('Conversation not found'));
    }
    
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json(createError('Not authorized to access this conversation'));
    }

    // Update messages
    const result = await Message.updateMany(
      {
        conversation: conversationId,
        receiver: req.user.id,
        isRead: false
      },
      { isRead: true }
    );

    res.json({ 
      message: 'Messages marked as read',
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json(createError('Error marking messages as read'));
  }
};

// Delete a message (soft delete or hide for the user)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json(createError('Message not found'));
    }
    
    // Only the sender can delete their message
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json(createError('Not authorized to delete this message'));
    }
    
    // For simplicity, we're actually removing the message
    // In a production app, you might want to implement soft delete instead
    await Message.findByIdAndDelete(messageId);
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json(createError('Error deleting message'));
  }
};

// Get unread message count for the current user
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiver: req.user.id,
      isRead: false
    });
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json(createError('Error getting unread message count'));
  }
};

// Archive a conversation
exports.archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Update conversation to archived (handle both field names for backward compatibility)
    conversation.isArchived = true;
    // If the old isActive field exists, update it as well
    if ('isActive' in conversation) {
      conversation.isActive = false;
    }
    
    await conversation.save();
    
    res.status(200).json({ message: 'Conversation archived successfully' });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Restore an archived conversation
exports.restoreConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Update conversation to unarchived (handle both field names for backward compatibility)
    conversation.isArchived = false;
    // If the old isActive field exists, update it as well
    if ('isActive' in conversation) {
      conversation.isActive = true;
    }
    
    await conversation.save();
    
    res.status(200).json({ message: 'Conversation restored successfully' });
  } catch (error) {
    console.error('Error restoring conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};