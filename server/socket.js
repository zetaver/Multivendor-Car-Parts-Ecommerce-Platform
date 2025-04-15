const socketIo = require('socket.io');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

const setupSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      // origin: process.env.CLIENT_URL || 'https://easycasse.kaamkonnect.com',
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000, // Increase ping timeout to 60 seconds
    pingInterval: 25000, // Check connection every 25 seconds
    transports: ['websocket', 'polling'], // Prefer websocket but fallback to polling
    allowEIO3: true // Allow compatibility with older clients
  });

  // Store online users
  const onlineUsers = new Map();

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.log('Socket authentication failed - No token provided');
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role || 'user';
      
      console.log(`Socket authenticated user: ${socket.userId} (${socket.userRole}) with socket ID: ${socket.id}`);
      
      // Update user's online status
      await User.findByIdAndUpdate(decoded.id, { lastActive: new Date() });
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected - ID: ${socket.userId}, Socket ID: ${socket.id}, Role: ${socket.userRole}`);
    onlineUsers.set(socket.userId, socket.id);
    
    // Send immediate confirmation of connected status
    socket.emit('connection-confirmed', { 
      userId: socket.userId,
      socketId: socket.id,
      timestamp: new Date()
    });

    // Join user's conversations
    socket.on('join-conversations', async (conversations) => {
      if (!Array.isArray(conversations) || conversations.length === 0) {
        console.error(`Invalid conversations array from user ${socket.userId}:`, conversations);
        return;
      }

      console.log(`User ${socket.userId} joining ${conversations.length} conversation rooms:`, conversations);
      
      // First, verify this user is a participant in all these conversations
      try {
        // Query database to make sure user is actually part of these conversations
        const validConversations = await Conversation.find({
          _id: { $in: conversations },
          participants: socket.userId
        }).select('_id');
        
        const validIds = validConversations.map(c => c._id.toString());
        
        // Leave any rooms the user might already be in to avoid duplication
        const socketRooms = Array.from(socket.rooms).filter(r => r.startsWith('conversation:'));
        if (socketRooms.length > 0) {
          console.log(`User ${socket.userId} already in rooms:`, socketRooms);
          socketRooms.forEach(room => {
            socket.leave(room);
          });
        }
        
        // Join each valid conversation room
        validIds.forEach(conversationId => {
          const roomName = `conversation:${conversationId}`;
          socket.join(roomName);
          console.log(`User ${socket.userId} joined room ${roomName}`);
        });
        
        // If there were any invalid IDs, log them
        const invalidIds = conversations.filter(id => !validIds.includes(id.toString()));
        if (invalidIds.length > 0) {
          console.warn(`User ${socket.userId} attempted to join invalid conversations:`, invalidIds);
        }
        
        // Verify the rooms the socket is now in
        const currentRooms = Array.from(socket.rooms);
        console.log(`User ${socket.userId} is now in rooms:`, currentRooms);
        
        // Confirm successful room joins back to the client
        socket.emit('rooms-joined', {
          rooms: validIds.map(id => `conversation:${id}`),
          timestamp: new Date()
        });
      } catch (error) {
        console.error(`Error joining conversations for user ${socket.userId}:`, error);
        socket.emit('room-join-error', { error: error.message });
      }
    });

    // Send message
    socket.on('send-message', async (data) => {
      try {
        const { conversationId, content } = data;

        console.log(`User ${socket.userId} sending message to conversation ${conversationId}`);
        console.log(`Socket rooms for this user:`, Array.from(socket.rooms));

        // Verify the conversation exists and user is a participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          console.error(`Conversation ${conversationId} not found`);
          return socket.emit('message-error', { error: 'Conversation not found' });
        }

        if (!conversation.participants.includes(socket.userId)) {
          console.error(`User ${socket.userId} is not authorized to send message to ${conversationId}`);
          return socket.emit('message-error', { error: 'Not authorized to send messages in this conversation' });
        }
        
        // Get the receiver (the other participant)
        const receiver = conversation.participants.find(
          p => p.toString() !== socket.userId
        );

        if (!receiver) {
          console.error(`Could not find receiver in conversation ${conversationId}`);
          return socket.emit('message-error', { error: 'Could not determine message receiver' });
        }

        // Create and save message
        const message = new Message({
          conversation: conversationId,
          sender: socket.userId,
          receiver: receiver,
          content
        });
        await message.save();

        // Update conversation's last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id
        });

        // Populate message with sender details
        await message.populate('sender', 'name avatar email firstName lastName');

        // Log the number of clients in the room
        const roomName = `conversation:${conversationId}`;
        const socketsInRoom = await io.in(roomName).fetchSockets();
        console.log(`Clients in room ${roomName}: ${socketsInRoom.length}`);
        console.log(`Client IDs in room:`, socketsInRoom.map(s => s.id));
        
        console.log(`Broadcasting new message ${message._id} to conversation room: ${roomName}`);
        
        // FIRST: Broadcast to the room (which should include both participants if connected)
        io.to(roomName).emit('new-message', {
          ...message.toObject(),
          _roomDelivery: roomName,  // Add debugging metadata
          _timestamp: new Date()
        });
        
        // SECOND: Direct notification to the specific receiver's socket if they're online
        const receiverSocketId = onlineUsers.get(receiver.toString());
        
        if (receiverSocketId) {
          console.log(`Sending direct notification to receiver ${receiver} with socket ID ${receiverSocketId}`);
          
          // Send a backup notification directly to the receiver's socket
          io.to(receiverSocketId).emit('message-notification', {
            message,
            conversationId,
            _direct: true, // Add debugging metadata
            _timestamp: new Date()
          });
          
          // Also send the message again directly to make sure it's received
          io.to(receiverSocketId).emit('new-message', {
            ...message.toObject(),
            _directDelivery: true, // Add debugging metadata
            _timestamp: new Date()
          });
        } else {
          console.log(`Receiver ${receiver} is not currently online, no direct notification sent`);
        }
        
        // Send confirmation back to sender
        socket.emit('message-sent-confirmation', {
          messageId: message._id,
          conversationId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing-start', ({ conversationId }) => {
      console.log(`User ${socket.userId} started typing in conversation ${conversationId}`);
      socket.to(`conversation:${conversationId}`).emit('typing-start', {
        userId: socket.userId,
        conversationId,
        timestamp: new Date()
      });
    });

    socket.on('typing-stop', ({ conversationId }) => {
      console.log(`User ${socket.userId} stopped typing in conversation ${conversationId}`);
      socket.to(`conversation:${conversationId}`).emit('typing-stop', {
        userId: socket.userId,
        conversationId,
        timestamp: new Date()
      });
    });

    // Mark messages as read
    socket.on('mark-read', async ({ conversationId }) => {
      try {
        console.log(`User ${socket.userId} marking messages as read for conversation: ${conversationId}`);
        
        // Verify the conversation exists and user is a participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          console.error(`Conversation ${conversationId} not found`);
          return;
        }
        
        if (!conversation.participants.includes(socket.userId)) {
          console.error(`User ${socket.userId} is not a participant in conversation ${conversationId}`);
          return;
        }
        
        // Update unread messages
        const result = await Message.updateMany(
          {
            conversation: conversationId,
            receiver: socket.userId,
            isRead: false
          },
          { isRead: true }
        );
        
        console.log(`Marked ${result.modifiedCount} messages as read in conversation ${conversationId}`);
        
        // Emit event to all users in the conversation room
        io.to(`conversation:${conversationId}`).emit('messages-read', {
          conversationId,
          userId: socket.userId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
        socket.emit('read-error', { error: 'Failed to mark messages as read' });
      }
    });

    // Check connection status - respond to ping with pong
    socket.on('ping', (data) => {
      console.log(`Received ping from ${socket.userId}`);
      socket.emit('pong', { 
        received: data,
        timestamp: new Date(),
        socketId: socket.id
      });
    });

    // Handle reconnection
    socket.on('reconnect-attempt', () => {
      console.log(`User ${socket.userId} attempting to reconnect`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected - ID: ${socket.userId}, Reason: ${reason}`);
      onlineUsers.delete(socket.userId);
    });
  });

  return io;
};

module.exports = setupSocket;