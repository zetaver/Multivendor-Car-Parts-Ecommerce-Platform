const socketIo = require('socket.io');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

const setupSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  // Store online users
  const onlineUsers = new Map();

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      
      // Update user's online status
      await User.findByIdAndUpdate(decoded.id, { lastActive: new Date() });
      
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);
    onlineUsers.set(socket.userId, socket.id);

    // Join user's conversations
    socket.on('join-conversations', async (conversations) => {
      conversations.forEach(conversationId => {
        socket.join(`conversation:${conversationId}`);
      });
    });

    // Send message
    socket.on('send-message', async (data) => {
      try {
        const { conversationId, content, receiverId } = data;

        // Create and save message
        const message = new Message({
          conversation: conversationId,
          sender: socket.userId,
          receiver: receiverId,
          content
        });
        await message.save();

        // Update conversation's last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id
        });

        // Populate message with sender details
        await message.populate('sender', 'name avatar');

        // Emit message to conversation room
        io.to(`conversation:${conversationId}`).emit('new-message', message);

        // Send notification to receiver if they're not in the conversation room
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message-notification', {
            message,
            conversationId
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing-start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing-start', {
        userId: socket.userId,
        conversationId
      });
    });

    socket.on('typing-stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing-stop', {
        userId: socket.userId,
        conversationId
      });
    });

    // Mark messages as read
    socket.on('mark-read', async ({ conversationId }) => {
      try {
        await Message.updateMany(
          {
            conversation: conversationId,
            receiver: socket.userId,
            isRead: false
          },
          { isRead: true }
        );

        socket.to(`conversation:${conversationId}`).emit('messages-read', {
          conversationId,
          userId: socket.userId
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
      onlineUsers.delete(socket.userId);
    });
  });

  return io;
};

module.exports = setupSocket;