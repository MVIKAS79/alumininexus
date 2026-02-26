const express = require('express');
const router = express.Router();
const {
  sendRequest,
  acceptRequest,
  rejectRequest,
  removeConnection,
  getMyConnections,
  getPendingRequests,
  getConnectionStatus
} = require('../controllers/connectionController');
const { protect } = require('../middleware/auth');
const { validateObjectId, handleValidationErrors } = require('../middleware/validation');

// All routes require authentication
router.use(protect);

// Get my connections
router.get('/', getMyConnections);

// Get pending requests
router.get('/pending', getPendingRequests);

// Get connection status with a user
router.get('/status/:userId', validateObjectId('userId'), handleValidationErrors, getConnectionStatus);

// Send connection request
router.post('/request/:userId', validateObjectId('userId'), handleValidationErrors, sendRequest);

// Accept connection request
router.put('/accept/:userId', validateObjectId('userId'), handleValidationErrors, acceptRequest);

// Reject/Cancel connection request
router.delete('/request/:userId', validateObjectId('userId'), handleValidationErrors, rejectRequest);

// Remove connection
router.delete('/:userId', validateObjectId('userId'), handleValidationErrors, removeConnection);

module.exports = router;
