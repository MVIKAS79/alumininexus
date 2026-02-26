const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  getUnreadCount,
  deleteMessage,
  searchMessages
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { validateMessage, validateObjectId, handleValidationErrors } = require('../middleware/validation');

// All routes require authentication
router.use(protect);

// Get all conversations (inbox)
router.get('/conversations', getConversations);

// Get unread count
router.get('/unread', getUnreadCount);

// Search messages
router.get('/search', searchMessages);

// Get conversation with specific user
router.get('/conversation/:userId', validateObjectId('userId'), handleValidationErrors, getConversation);

// Send message
router.post('/:receiverId', validateMessage, handleValidationErrors, sendMessage);

// Mark messages as read
router.put('/read/:senderId', validateObjectId('senderId'), handleValidationErrors, markAsRead);

// Delete message
router.delete('/:messageId', validateObjectId('messageId'), handleValidationErrors, deleteMessage);

module.exports = router;
