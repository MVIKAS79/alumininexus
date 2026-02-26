const express = require('express');
const router = express.Router();
const {
  requestMentorship,
  getMyRequests,
  getMentorRequests,
  respondToRequest,
  getMentorshipDetails,
  cancelRequest,
  completeMentorship,
  getAvailableMentors
} = require('../controllers/mentorshipController');
const { protect, authorize } = require('../middleware/auth');
const { validateMentorshipRequest, validateObjectId, handleValidationErrors } = require('../middleware/validation');

// All routes require authentication
router.use(protect);

// Get available mentors
router.get('/mentors', getAvailableMentors);

// Get my requests (as student)
router.get('/my-requests', getMyRequests);

// Get requests received (as mentor)
router.get('/requests', authorize('alumni', 'admin'), getMentorRequests);

// Get single mentorship details
router.get('/:requestId', validateObjectId('requestId'), handleValidationErrors, getMentorshipDetails);

// Request mentorship
router.post('/:mentorId', validateMentorshipRequest, handleValidationErrors, requestMentorship);

// Respond to request (alumni only)
router.put('/:requestId/respond', authorize('alumni', 'admin'), validateObjectId('requestId'), handleValidationErrors, respondToRequest);

// Complete mentorship
router.put('/:requestId/complete', validateObjectId('requestId'), handleValidationErrors, completeMentorship);

// Cancel request
router.delete('/:requestId', validateObjectId('requestId'), handleValidationErrors, cancelRequest);

module.exports = router;
