const User = require('../models/User');

// @desc    Send connection request
// @route   POST /api/connections/request/:userId
// @access  Private
exports.sendRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get current user with connection data
    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Can't connect to self
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot connect to yourself'
      });
    }

    // Check if already connected
    if (currentUser.connections.some(id => id.toString() === userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already connected with this user'
      });
    }

    // Check if request already sent
    const alreadySent = currentUser.connectionRequests.sent.some(
      req => req.user.toString() === userId
    );
    if (alreadySent) {
      return res.status(400).json({
        success: false,
        message: 'Connection request already sent'
      });
    }

    // Check if they already sent us a request
    const pendingFromThem = currentUser.connectionRequests.received.some(
      req => req.user.toString() === userId
    );
    if (pendingFromThem) {
      // Auto-accept if they already sent us a request
      return exports.acceptRequest(req, res);
    }

    // Add to sent requests
    currentUser.connectionRequests.sent.push({ user: userId });
    await currentUser.save();

    // Add to their received requests
    targetUser.connectionRequests.received.push({ user: req.user.id });
    await targetUser.save();

    res.json({
      success: true,
      message: 'Connection request sent'
    });
  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not send request'
    });
  }
};

// @desc    Accept connection request
// @route   PUT /api/connections/accept/:userId
// @access  Private
exports.acceptRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    const currentUser = await User.findById(req.user.id);
    const requestingUser = await User.findById(userId);

    if (!requestingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if request exists
    const requestIndex = currentUser.connectionRequests.received.findIndex(
      req => req.user.toString() === userId
    );

    if (requestIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'No pending request from this user'
      });
    }

    // Remove from received requests
    currentUser.connectionRequests.received.splice(requestIndex, 1);

    // Add to connections (both sides)
    if (!currentUser.connections.some(id => id.toString() === userId)) {
      currentUser.connections.push(userId);
    }

    await currentUser.save();

    // Update requesting user
    const sentIndex = requestingUser.connectionRequests.sent.findIndex(
      req => req.user.toString() === currentUser._id.toString()
    );
    if (sentIndex !== -1) {
      requestingUser.connectionRequests.sent.splice(sentIndex, 1);
    }

    if (!requestingUser.connections.some(id => id.toString() === req.user.id)) {
      requestingUser.connections.push(req.user.id);
    }

    await requestingUser.save();

    res.json({
      success: true,
      message: 'Connection accepted'
    });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not accept request'
    });
  }
};

// @desc    Reject/Cancel connection request
// @route   DELETE /api/connections/request/:userId
// @access  Private
exports.rejectRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    const currentUser = await User.findById(req.user.id);
    const otherUser = await User.findById(userId);

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if it's a received request (reject)
    const receivedIndex = currentUser.connectionRequests.received.findIndex(
      req => req.user.toString() === userId
    );

    if (receivedIndex !== -1) {
      // Remove from our received
      currentUser.connectionRequests.received.splice(receivedIndex, 1);
      await currentUser.save();

      // Remove from their sent
      const sentIndex = otherUser.connectionRequests.sent.findIndex(
        req => req.user.toString() === currentUser._id.toString()
      );
      if (sentIndex !== -1) {
        otherUser.connectionRequests.sent.splice(sentIndex, 1);
        await otherUser.save();
      }

      return res.json({
        success: true,
        message: 'Connection request rejected'
      });
    }

    // Check if it's a sent request (cancel)
    const sentIndex = currentUser.connectionRequests.sent.findIndex(
      req => req.user.toString() === userId
    );

    if (sentIndex !== -1) {
      // Remove from our sent
      currentUser.connectionRequests.sent.splice(sentIndex, 1);
      await currentUser.save();

      // Remove from their received
      const theirReceivedIndex = otherUser.connectionRequests.received.findIndex(
        req => req.user.toString() === currentUser._id.toString()
      );
      if (theirReceivedIndex !== -1) {
        otherUser.connectionRequests.received.splice(theirReceivedIndex, 1);
        await otherUser.save();
      }

      return res.json({
        success: true,
        message: 'Connection request cancelled'
      });
    }

    return res.status(400).json({
      success: false,
      message: 'No pending request found'
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not process request'
    });
  }
};

// @desc    Remove connection
// @route   DELETE /api/connections/:userId
// @access  Private
exports.removeConnection = async (req, res) => {
  try {
    const { userId } = req.params;

    const currentUser = await User.findById(req.user.id);
    const otherUser = await User.findById(userId);

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if connected
    if (!currentUser.connections.some(id => id.toString() === userId)) {
      return res.status(400).json({
        success: false,
        message: 'Not connected with this user'
      });
    }

    // Remove from both sides
    currentUser.connections = currentUser.connections.filter(
      id => id.toString() !== userId
    );
    await currentUser.save();

    otherUser.connections = otherUser.connections.filter(
      id => id.toString() !== req.user.id
    );
    await otherUser.save();

    res.json({
      success: true,
      message: 'Connection removed'
    });
  } catch (error) {
    console.error('Remove connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not remove connection'
    });
  }
};

// @desc    Get my connections
// @route   GET /api/connections
// @access  Private
exports.getMyConnections = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('connections', 'name profileImage company designation role branch batchEnd isOnline');

    res.json({
      success: true,
      data: user.connections
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch connections'
    });
  }
};

// @desc    Get pending requests
// @route   GET /api/connections/pending
// @access  Private
exports.getPendingRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('connectionRequests.received.user', 'name profileImage company designation role')
      .populate('connectionRequests.sent.user', 'name profileImage company designation role');

    res.json({
      success: true,
      data: {
        received: user.connectionRequests.received,
        sent: user.connectionRequests.sent
      }
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch pending requests'
    });
  }
};

// @desc    Get connection status with a user
// @route   GET /api/connections/status/:userId
// @access  Private
exports.getConnectionStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findById(req.user.id);

    let status = 'none';

    if (currentUser.connections.some(id => id.toString() === userId)) {
      status = 'connected';
    } else if (currentUser.connectionRequests.sent.some(r => r.user.toString() === userId)) {
      status = 'pending_sent';
    } else if (currentUser.connectionRequests.received.some(r => r.user.toString() === userId)) {
      status = 'pending_received';
    }

    res.json({
      success: true,
      data: { status }
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not get connection status'
    });
  }
};
