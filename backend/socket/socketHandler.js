const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket auth error:', error.message);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`📱 User connected: ${socket.user.name} (${userId})`);

    // Join personal room
    socket.join(userId);

    // Update online status
    await User.findByIdAndUpdate(userId, { 
      isOnline: true, 
      lastActive: new Date() 
    });

    // Broadcast online status to connections
    socket.user.connections?.forEach(connectionId => {
      io.to(connectionId.toString()).emit('user:status', {
        userId,
        isOnline: true
      });
    });

    // Handle sending messages
    socket.on('message:send', async (data) => {
      try {
        const { receiverId, content, messageType = 'text' } = data;

        // Create message
        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          content,
          messageType
        });

        // Populate sender info
        await message.populate('sender', 'name profileImage');
        await message.populate('receiver', 'name profileImage');

        // Send to receiver
        io.to(receiverId).emit('message:receive', {
          message: message.toObject()
        });

        // Confirm to sender
        socket.emit('message:sent', {
          message: message.toObject()
        });

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('message:error', {
          error: 'Could not send message'
        });
      }
    });

    // Handle typing indicator
    socket.on('typing:start', (data) => {
      const { receiverId } = data;
      io.to(receiverId).emit('typing:start', {
        userId,
        userName: socket.user.name
      });
    });

    socket.on('typing:stop', (data) => {
      const { receiverId } = data;
      io.to(receiverId).emit('typing:stop', {
        userId
      });
    });

    // Handle message read
    socket.on('message:read', async (data) => {
      try {
        const { senderId } = data;

        await Message.markAsRead(senderId, userId);

        // Notify sender that messages were read
        io.to(senderId).emit('message:read', {
          readBy: userId
        });

      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Join a chat room (for group chats in future)
    socket.on('room:join', (roomId) => {
      socket.join(roomId);
      console.log(`User ${userId} joined room ${roomId}`);
    });

    // Leave a chat room
    socket.on('room:leave', (roomId) => {
      socket.leave(roomId);
      console.log(`User ${userId} left room ${roomId}`);
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`📴 User disconnected: ${socket.user.name}`);

      // Update offline status
      await User.findByIdAndUpdate(userId, { 
        isOnline: false, 
        lastActive: new Date() 
      });

      // Broadcast offline status to connections
      socket.user.connections?.forEach(connectionId => {
        io.to(connectionId.toString()).emit('user:status', {
          userId,
          isOnline: false
        });
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

// Helper function to emit events from other parts of the application
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(userId).emit(event, data);
  }
};

// Emit notification
const emitNotification = (userId, notification) => {
  emitToUser(userId, 'notification', notification);
};

module.exports = {
  initializeSocket,
  emitToUser,
  emitNotification
};
