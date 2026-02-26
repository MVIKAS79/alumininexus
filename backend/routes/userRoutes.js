const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  getStats,
  searchUsers,
  getSuggestions
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { validateSearch, validateObjectId, handleValidationErrors } = require('../middleware/validation');

// All routes require authentication
router.use(protect);

// Get users with filters
router.get('/', validateSearch, handleValidationErrors, getUsers);

// Get statistics
router.get('/stats', getStats);

// Search users
router.get('/search', searchUsers);

// Get suggested connections
router.get('/suggestions', getSuggestions);

// Get user by ID
router.get('/:id', validateObjectId('id'), handleValidationErrors, getUserById);

module.exports = router;
