const Message = require('../models/Message');
const User = require('../models/User');
const { emitToUser } = require('../socket/socketHandler');

// Helper to escape regex special characters
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');

// @desc    Send a message
// @route   POST /api/messages/:receiverId
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { content, messageType = 'text' } = req.body;
    const { receiverId } = req.params;

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Prevent sending message to self
    if (receiverId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself'
      });
    }

    const message = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      content,
      messageType
    });

    // Populate sender info
    await message.populate('sender', 'name profileImage');
    await message.populate('receiver', 'name profileImage');

    // Emit socket event for real-time delivery
    emitToUser(receiverId, 'message:receive', {
      message: message.toObject()
    });

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not send message'
    });
  }
};

// @desc    Get conversation with a user
// @route   GET /api/messages/conversation/:userId
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Get conversation
    const messages = await Message.getConversation(
      req.user.id,
      userId,
      parseInt(page),
      parseInt(limit)
    );

    // Get other user's info
    const otherUser = await User.findById(userId)
      .select('name profileImage isOnline lastActive');

    // Mark messages as read
    await Message.markAsRead(userId, req.user.id);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Chronological order
        otherUser,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: messages.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch conversation'
    });
  }
};

// @desc    Get all conversations (inbox)
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Message.getRecentConversations(req.user.id);

    // Get user details for each conversation
    const conversationsWithUsers = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.lastMessage.sender.toString() === req.user.id
          ? conv.lastMessage.receiver
          : conv.lastMessage.sender;

        const otherUser = await User.findById(otherUserId)
          .select('name profileImage isOnline company designation');

        return {
          conversationId: conv._id,
          otherUser,
          lastMessage: {
            content: conv.lastMessage.content,
            createdAt: conv.lastMessage.createdAt,
            isFromMe: conv.lastMessage.sender.toString() === req.user.id
          },
          unreadCount: conv.unreadCount
        };
      })
    );

    res.json({
      success: true,
      data: conversationsWithUsers
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch conversations'
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:senderId
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;

    const result = await Message.markAsRead(senderId, req.user.id);

    res.json({
      success: true,
      message: `${result.modifiedCount} messages marked as read`
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not mark messages as read'
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.user.id);

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch unread count'
    });
  }
};

// @desc    Delete a message (soft delete)
// @route   DELETE /api/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is sender or receiver
    const isSender = message.sender.toString() === req.user.id;
    const isReceiver = message.receiver.toString() === req.user.id;

    if (!isSender && !isReceiver) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    // Soft delete
    if (isSender) {
      message.isDeleted.deletedBySender = true;
    }
    if (isReceiver) {
      message.isDeleted.deletedByReceiver = true;
    }

    await message.save();

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not delete message'
    });
  }
};

// @desc    Search messages
// @route   GET /api/messages/search
// @access  Private
exports.searchMessages = async (req, res) => {
  try {
    const { q, userId } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const query = {
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id }
      ],
      content: new RegExp(escapeRegex(q), 'i')
    };

    if (userId) {
      query.$or = [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id }
      ];
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('sender', 'name profileImage')
      .populate('receiver', 'name profileImage');

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
};
