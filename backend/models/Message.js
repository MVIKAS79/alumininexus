const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  attachment: {
    filename: String,
    url: String,
    size: Number
  },
  readStatus: {
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: Date
  },
  isDeleted: {
    deletedBySender: {
      type: Boolean,
      default: false
    },
    deletedByReceiver: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Index for efficient message queries
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, 'readStatus.isRead': 1 });

// Virtual for conversation ID (sorted user IDs)
messageSchema.virtual('conversationId').get(function() {
  const ids = [this.sender.toString(), this.receiver.toString()].sort();
  return ids.join('_');
});

// Static method to get conversation between two users
messageSchema.statics.getConversation = async function(userId1, userId2, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return await this.find({
    $or: [
      { sender: userId1, receiver: userId2, 'isDeleted.deletedBySender': false },
      { sender: userId2, receiver: userId1, 'isDeleted.deletedByReceiver': false }
    ]
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name profileImage')
    .populate('receiver', 'name profileImage');
};

// Static method to get recent conversations for a user
messageSchema.statics.getRecentConversations = async function(userId) {
  const messages = await this.aggregate([
    {
      $match: {
        $or: [
          { sender: mongoose.Types.ObjectId.createFromHexString(userId) },
          { receiver: mongoose.Types.ObjectId.createFromHexString(userId) }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $gt: ['$sender', '$receiver'] },
            { $concat: [{ $toString: '$receiver' }, '_', { $toString: '$sender' }] },
            { $concat: [{ $toString: '$sender' }, '_', { $toString: '$receiver' }] }
          ]
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$receiver', mongoose.Types.ObjectId.createFromHexString(userId)] },
                  { $eq: ['$readStatus.isRead', false] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    },
    {
      $limit: 20
    }
  ]);

  return messages;
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = async function(senderId, receiverId) {
  return await this.updateMany(
    {
      sender: senderId,
      receiver: receiverId,
      'readStatus.isRead': false
    },
    {
      $set: {
        'readStatus.isRead': true,
        'readStatus.readAt': new Date()
      }
    }
  );
};

// Static method to get unread count
messageSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    receiver: userId,
    'readStatus.isRead': false
  });
};

module.exports = mongoose.model('Message', messageSchema);
