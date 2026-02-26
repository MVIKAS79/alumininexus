const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  updateProfile,
  uploadProfileImage,
  upload,
  updateSkills,
  toggleMentorship,
  updateNotifications,
  updatePrivacy,
  deleteAccount
} = require('../controllers/profileController');
const { protect, authorize } = require('../middleware/auth');
const { validateProfileUpdate, handleValidationErrors } = require('../middleware/validation');

// All routes require authentication
router.use(protect);

// Get my profile
router.get('/me', getMyProfile);

// Update profile
router.put('/', validateProfileUpdate, handleValidationErrors, updateProfile);

// Upload profile image
router.put('/image', upload.single('image'), uploadProfileImage);

// Update skills
router.put('/skills', updateSkills);

// Toggle mentorship availability (alumni only)
router.put('/mentorship', authorize('alumni', 'admin'), toggleMentorship);

// Update notification preferences
router.put('/notifications', updateNotifications);

// Update privacy settings
router.put('/privacy', updatePrivacy);

// Delete account
router.delete('/', deleteAccount);

module.exports = router;
