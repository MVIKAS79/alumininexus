const express = require('express');
const router = express.Router();
const {
  getDashboardAnalytics,
  getAlumniByCompany,
  getAlumniByLocation,
  getBatchAnalytics,
  getEngagementMetrics,
  exportAlumniData
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and placement/admin role
router.use(protect);
router.use(authorize('placement', 'admin'));

// Dashboard analytics
router.get('/dashboard', getDashboardAnalytics);

// Alumni by company
router.get('/companies', getAlumniByCompany);

// Alumni by location
router.get('/locations', getAlumniByLocation);

// Batch analytics
router.get('/batches', getBatchAnalytics);

// Engagement metrics
router.get('/engagement', getEngagementMetrics);

// Export alumni data
router.get('/export', exportAlumniData);

module.exports = router;
