const Mentorship = require('../models/Mentorship');
const User = require('../models/User');

// @desc    Request mentorship
// @route   POST /api/mentorship/:mentorId
// @access  Private (Students)
exports.requestMentorship = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { topic, message, areas, preferredMode, availability } = req.body;

    // Check if mentor exists and is available
    const mentor = await User.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    if (mentor.role !== 'alumni') {
      return res.status(400).json({
        success: false,
        message: 'You can only request mentorship from alumni'
      });
    }

    // prevent self-request
    if (mentorId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot request mentorship from yourself'
      });
    }

    // Check for existing pending request
    const existingRequest = await Mentorship.findOne({
      student: req.user.id,
      mentor: mentorId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request with this mentor'
      });
    }

    const mentorship = await Mentorship.create({
      student: req.user.id,
      mentor: mentorId,
      topic,
      message,
      areas,
      preferredMode,
      availability
    });

    await mentorship.populate('mentor', 'name profileImage company');

    res.status(201).json({
      success: true,
      message: 'Mentorship request sent',
      data: mentorship
    });
  } catch (error) {
    console.error('Request mentorship error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Could not send request'
    });
  }
};

// @desc    Get my mentorship requests (as student)
// @route   GET /api/mentorship/my-requests
// @access  Private
exports.getMyRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const requests = await Mentorship.getStudentRequests(req.user.id, status);

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch requests'
    });
  }
};

// @desc    Get mentorship requests (as mentor)
// @route   GET /api/mentorship/requests
// @access  Private (Alumni)
exports.getMentorRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const requests = await Mentorship.getMentorRequests(req.user.id, status);

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get mentor requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch requests'
    });
  }
};

// @desc    Respond to mentorship request
// @route   PUT /api/mentorship/:requestId/respond
// @access  Private (Alumni - Mentor only)
exports.respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, responseMessage } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be accepted or rejected'
      });
    }

    const mentorship = await Mentorship.findById(requestId);

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if current user is the mentor
    if (mentorship.mentor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this request'
      });
    }

    if (mentorship.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been responded to'
      });
    }

    mentorship.status = status;
    mentorship.responseMessage = responseMessage;
    mentorship.respondedAt = new Date();

    await mentorship.save();
    await mentorship.populate('student', 'name email profileImage');

    res.json({
      success: true,
      message: `Request ${status}`,
      data: mentorship
    });
  } catch (error) {
    console.error('Respond to request error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not respond to request'
    });
  }
};

// @desc    Get single mentorship details
// @route   GET /api/mentorship/:requestId
// @access  Private
exports.getMentorshipDetails = async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.requestId)
      .populate('student', 'name email profileImage branch batchEnd')
      .populate('mentor', 'name email profileImage company designation');

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship not found'
      });
    }

    // Check if user is part of this mentorship
    const isStudent = mentorship.student._id.toString() === req.user.id;
    const isMentor = mentorship.mentor._id.toString() === req.user.id;

    if (!isStudent && !isMentor && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this mentorship'
      });
    }

    res.json({
      success: true,
      data: mentorship
    });
  } catch (error) {
    console.error('Get mentorship details error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch mentorship details'
    });
  }
};

// @desc    Cancel mentorship request
// @route   DELETE /api/mentorship/:requestId
// @access  Private (Student only)
exports.cancelRequest = async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.requestId);

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if current user is the student
    if (mentorship.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this request'
      });
    }

    if (mentorship.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending requests'
      });
    }

    mentorship.status = 'cancelled';
    await mentorship.save();

    res.json({
      success: true,
      message: 'Request cancelled'
    });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not cancel request'
    });
  }
};

// @desc    Complete mentorship
// @route   PUT /api/mentorship/:requestId/complete
// @access  Private
exports.completeMentorship = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const mentorship = await Mentorship.findById(req.params.requestId);

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship not found'
      });
    }

    if (mentorship.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Can only complete accepted mentorships'
      });
    }

    const isStudent = mentorship.student.toString() === req.user.id;
    const isMentor = mentorship.mentor.toString() === req.user.id;

    if (!isStudent && !isMentor) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Add rating
    if (rating) {
      if (isStudent) {
        mentorship.rating.mentorRating = rating;
      } else {
        mentorship.rating.studentRating = rating;
      }
    }

    // If both have rated, mark as completed
    if (mentorship.rating.mentorRating && mentorship.rating.studentRating) {
      mentorship.status = 'completed';
    }

    await mentorship.save();

    res.json({
      success: true,
      message: 'Rating submitted',
      data: mentorship
    });
  } catch (error) {
    console.error('Complete mentorship error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not complete mentorship'
    });
  }
};

// @desc    Get available mentors
// @route   GET /api/mentorship/mentors
// @access  Private
exports.getAvailableMentors = async (req, res) => {
  try {
    const { branch, area, page = 1, limit = 10 } = req.query;

    const query = {
      role: 'alumni',
      isAvailableForMentorship: true,
      _id: { $ne: req.user.id }
    };

    if (branch && branch !== 'All') {
      query.branch = branch;
    }

    if (area) {
      query.mentorshipAreas = area;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [mentors, total] = await Promise.all([
      User.find(query)
        .select('name profileImage company designation branch mentorshipAreas bio')
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: mentors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get mentors error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch mentors'
    });
  }
};
