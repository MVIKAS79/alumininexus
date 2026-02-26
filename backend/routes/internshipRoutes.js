const express = require('express');
const router = express.Router();
const {
  createInternship,
  getInternships,
  getInternship,
  updateInternship,
  deleteInternship,
  applyToInternship,
  getMyPosts,
  getApplications,
  updateApplicationStatus
} = require('../controllers/internshipController');
const { protect, authorize } = require('../middleware/auth');
const { validateInternship, validateObjectId, handleValidationErrors } = require('../middleware/validation');

// All routes require authentication
router.use(protect);

// Get all internships
router.get('/', getInternships);

// Get my posted opportunities
router.get('/my-posts', authorize('alumni', 'placement', 'admin'), getMyPosts);

// Get single internship
router.get('/:id', validateObjectId('id'), handleValidationErrors, getInternship);

// Create internship (alumni and placement only)
router.post('/', authorize('alumni', 'placement', 'admin'), validateInternship, handleValidationErrors, createInternship);

// Update internship
router.put('/:id', validateObjectId('id'), handleValidationErrors, updateInternship);

// Delete internship
router.delete('/:id', validateObjectId('id'), handleValidationErrors, deleteInternship);

// Apply to internship (students only)
router.post('/:id/apply', authorize('student'), validateObjectId('id'), handleValidationErrors, applyToInternship);

// Get applications for an opportunity
router.get('/:id/applications', validateObjectId('id'), handleValidationErrors, getApplications);

// Update application status
router.put('/:id/applications/:userId', updateApplicationStatus);

module.exports = router;
