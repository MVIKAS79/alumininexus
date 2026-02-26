const User = require('../models/User');

// Helper to escape regex special characters (prevent ReDoS)
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get all users with filters (Alumni Directory)
// @route   GET /api/users
// @access  Private
exports.getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      branch,
      batchStart,
      batchEnd,
      company,
      role,
      search,
      isAvailableForMentorship,
      country,
      city
    } = req.query;

    // Build query
    const query = {};

    // Role filter (default to alumni for directory)
    if (role) {
      query.role = role;
    }

    // Branch filter
    if (branch && branch !== 'All') {
      query.branch = branch;
    }

    // Batch filter
    if (batchStart) {
      query.batchStart = { $gte: parseInt(batchStart) };
    }
    if (batchEnd) {
      query.batchEnd = { $lte: parseInt(batchEnd) };
    }

    // Company filter
    if (company) {
      query.company = new RegExp(escapeRegex(company), 'i');
    }

    // Mentorship availability filter
    if (isAvailableForMentorship === 'true') {
      query.isAvailableForMentorship = true;
    }

    // Location filters
    if (country) {
      query['location.country'] = new RegExp(country, 'i');
    }
    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }

    // Text search
    if (search) {
      const escapedSearch = escapeRegex(search);
      query.$or = [
        { name: new RegExp(escapedSearch, 'i') },
        { company: new RegExp(escapedSearch, 'i') },
        { skills: { $in: [new RegExp(escapedSearch, 'i')] } },
        { designation: new RegExp(escapedSearch, 'i') }
      ];
    }

    // Exclude current user
    query._id = { $ne: req.user.id };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -verificationToken -resetPasswordToken -connectionRequests')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch users'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -verificationToken -resetPasswordToken')
      .populate('connections', 'name profileImage company designation');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if current user is connected
    const isConnected = user.connections.some(
      conn => conn._id.toString() === req.user.id
    );

    // Check if connection request is pending
    const isPending = req.user.connectionRequests?.sent?.some(
      req => req.user.toString() === user._id.toString()
    );

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        isConnected,
        isPending
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch user'
    });
  }
};

// @desc    Get alumni statistics
// @route   GET /api/users/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    const [
      totalAlumni,
      totalStudents,
      branchStats,
      companyStats,
      countryStats,
      batchStats
    ] = await Promise.all([
      User.countDocuments({ role: 'alumni' }),
      User.countDocuments({ role: 'student' }),
      User.aggregate([
        { $match: { role: 'alumni' } },
        { $group: { _id: '$branch', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      User.aggregate([
        { $match: { role: 'alumni', company: { $exists: true, $ne: '' } } },
        { $group: { _id: '$company', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      User.aggregate([
        { $match: { role: 'alumni', 'location.country': { $exists: true } } },
        { $group: { _id: '$location.country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      User.aggregate([
        { $match: { role: 'alumni' } },
        { $group: { _id: '$batchEnd', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalAlumni,
        totalStudents,
        branchStats,
        companyStats,
        countryStats,
        batchStats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch statistics'
    });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user.id } },
        {
          $or: [
            { name: new RegExp(escapeRegex(q), 'i') },
            { email: new RegExp(escapeRegex(q), 'i') },
            { company: new RegExp(escapeRegex(q), 'i') }
          ]
        }
      ]
    })
      .select('name email profileImage role company designation branch')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
};

// @desc    Get suggested connections
// @route   GET /api/users/suggestions
// @access  Private
exports.getSuggestions = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const { limit = 5 } = req.query;

    // Get users with same branch or from same batch
    const suggestions = await User.find({
      _id: { 
        $ne: req.user.id,
        $nin: currentUser.connections 
      },
      $or: [
        { branch: currentUser.branch },
        { 
          batchStart: { 
            $gte: currentUser.batchStart - 2, 
            $lte: currentUser.batchStart + 2 
          } 
        }
      ]
    })
      .select('name profileImage role company designation branch batchEnd')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch suggestions'
    });
  }
};
