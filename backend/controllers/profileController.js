const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Configure multer for profile image upload
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// @desc    Get current user profile
// @route   GET /api/profiles/me
// @access  Private
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -verificationToken -resetPasswordToken')
      .populate('connections', 'name profileImage company designation role')
      .populate('connectionRequests.received.user', 'name profileImage company')
      .populate('connectionRequests.sent.user', 'name profileImage company');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch profile'
    });
  }
};

// @desc    Update profile
// @route   PUT /api/profiles
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      'name', 'bio', 'company', 'designation', 'skills',
      'location', 'linkedinUrl', 'isAvailableForMentorship',
      'mentorshipAreas'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -verificationToken -resetPasswordToken');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Could not update profile'
    });
  }
};

// @desc    Upload profile image
// @route   PUT /api/profiles/image
// @access  Private
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: req.file.filename },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile image updated',
      data: {
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not upload image'
    });
  }
};

// @desc    Update skills
// @route   PUT /api/profiles/skills
// @access  Private
exports.updateSkills = async (req, res) => {
  try {
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({
        success: false,
        message: 'Skills must be an array'
      });
    }

    if (skills.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 20 skills allowed'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { skills },
      { new: true }
    ).select('skills');

    res.json({
      success: true,
      message: 'Skills updated',
      data: {
        skills: user.skills
      }
    });
  } catch (error) {
    console.error('Update skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update skills'
    });
  }
};

// @desc    Toggle mentorship availability
// @route   PUT /api/profiles/mentorship
// @access  Private (Alumni only)
exports.toggleMentorship = async (req, res) => {
  try {
    const { isAvailable, areas } = req.body;

    const updateData = {
      isAvailableForMentorship: isAvailable
    };

    if (areas && Array.isArray(areas)) {
      updateData.mentorshipAreas = areas;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('isAvailableForMentorship mentorshipAreas');

    res.json({
      success: true,
      message: `Mentorship ${isAvailable ? 'enabled' : 'disabled'}`,
      data: user
    });
  } catch (error) {
    console.error('Toggle mentorship error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update mentorship settings'
    });
  }
};

// @desc    Update notification preferences
// @route   PUT /api/profiles/notifications
// @access  Private
exports.updateNotifications = async (req, res) => {
  try {
    const allowedKeys = [
      'emailMessages', 'emailConnections', 'emailOpportunities',
      'emailMentorship', 'pushMessages', 'pushConnections'
    ];
    const update = {};
    allowedKeys.forEach(key => {
      if (typeof req.body[key] === 'boolean') {
        update[`notifications.${key}`] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true }
    ).select('notifications');

    res.json({
      success: true,
      message: 'Notification preferences updated',
      data: user.notifications
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update notification preferences'
    });
  }
};

// @desc    Update privacy settings
// @route   PUT /api/profiles/privacy
// @access  Private
exports.updatePrivacy = async (req, res) => {
  try {
    const update = {};
    if (typeof req.body.showEmail === 'boolean') {
      update['privacy.showEmail'] = req.body.showEmail;
    }
    if (typeof req.body.showPhone === 'boolean') {
      update['privacy.showPhone'] = req.body.showPhone;
    }
    if (['public', 'connections', 'private'].includes(req.body.profileVisibility)) {
      update['privacy.profileVisibility'] = req.body.profileVisibility;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true }
    ).select('privacy');

    res.json({
      success: true,
      message: 'Privacy settings updated',
      data: user.privacy
    });
  } catch (error) {
    console.error('Update privacy error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update privacy settings'
    });
  }
};

// @desc    Delete account
// @route   DELETE /api/profiles
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    // Verify password before deletion
    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Clean up orphaned data
    const Message = require('../models/Message');
    const Mentorship = require('../models/Mentorship');
    const Internship = require('../models/Internship');

    await Promise.all([
      // Remove from all users' connections and connection requests
      User.updateMany(
        { connections: req.user.id },
        { $pull: { connections: req.user.id } }
      ),
      User.updateMany(
        { 'connectionRequests.sent.user': req.user.id },
        { $pull: { 'connectionRequests.sent': { user: req.user.id } } }
      ),
      User.updateMany(
        { 'connectionRequests.received.user': req.user.id },
        { $pull: { 'connectionRequests.received': { user: req.user.id } } }
      ),
      // Delete messages
      Message.deleteMany({
        $or: [{ sender: req.user.id }, { receiver: req.user.id }]
      }),
      // Delete mentorships
      Mentorship.deleteMany({
        $or: [{ mentor: req.user.id }, { mentee: req.user.id }]
      }),
      // Delete internships posted by user
      Internship.deleteMany({ postedBy: req.user.id }),
      // Remove from internship applicants
      Internship.updateMany(
        { 'applicants.user': req.user.id },
        { $pull: { applicants: { user: req.user.id } } }
      )
    ]);

    await User.findByIdAndDelete(req.user.id);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not delete account'
    });
  }
};
