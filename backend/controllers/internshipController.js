const Internship = require('../models/Internship');

// @desc    Create internship/opportunity
// @route   POST /api/internships
// @access  Private (Alumni, Placement, Admin)
exports.createInternship = async (req, res) => {
  try {
    // Whitelist allowed fields to prevent mass-assignment
    const allowedFields = [
      'title', 'company', 'type', 'description', 'requirements', 'skills',
      'location', 'salary', 'duration', 'eligibility', 'applicationDeadline',
      'applyLink', 'applyEmail', 'status'
    ];
    const internshipData = { postedBy: req.user.id };
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        internshipData[field] = req.body[field];
      }
    });
    if (!internshipData.company) {
      internshipData.company = req.user.company;
    }

    const internship = await Internship.create(internshipData);

    res.status(201).json({
      success: true,
      message: 'Opportunity posted successfully',
      data: internship
    });
  } catch (error) {
    console.error('Create internship error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Could not create opportunity'
    });
  }
};

// @desc    Get all internships with filters
// @route   GET /api/internships
// @access  Private
exports.getInternships = async (req, res) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;

    const result = await Internship.getFiltered(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get internships error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch opportunities'
    });
  }
};

// @desc    Get single internship
// @route   GET /api/internships/:id
// @access  Private
exports.getInternship = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id)
      .populate('postedBy', 'name profileImage company designation email');

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    // Increment view count
    internship.views += 1;
    await internship.save();

    // Check if user has applied
    const hasApplied = internship.applicants.some(
      app => app.user.toString() === req.user.id
    );

    res.json({
      success: true,
      data: {
        ...internship.toObject(),
        hasApplied
      }
    });
  } catch (error) {
    console.error('Get internship error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch opportunity'
    });
  }
};

// @desc    Update internship
// @route   PUT /api/internships/:id
// @access  Private (Owner only)
exports.updateInternship = async (req, res) => {
  try {
    let internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    // Check ownership
    if (internship.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this opportunity'
      });
    }

    // Whitelist allowed fields for update
    const allowedUpdateFields = [
      'title', 'company', 'type', 'description', 'requirements', 'skills',
      'location', 'salary', 'duration', 'eligibility', 'applicationDeadline',
      'applyLink', 'applyEmail', 'status'
    ];
    const updateData = {};
    allowedUpdateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    internship = await Internship.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Opportunity updated',
      data: internship
    });
  } catch (error) {
    console.error('Update internship error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update opportunity'
    });
  }
};

// @desc    Delete internship
// @route   DELETE /api/internships/:id
// @access  Private (Owner only)
exports.deleteInternship = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    // Check ownership
    if (internship.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this opportunity'
      });
    }

    await internship.deleteOne();

    res.json({
      success: true,
      message: 'Opportunity deleted'
    });
  } catch (error) {
    console.error('Delete internship error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not delete opportunity'
    });
  }
};

// @desc    Apply to internship
// @route   POST /api/internships/:id/apply
// @access  Private (Students only)
exports.applyToInternship = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    if (internship.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This opportunity is no longer active'
      });
    }

    // Check if already applied
    const alreadyApplied = internship.applicants.some(
      app => app.user.toString() === req.user.id
    );

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied'
      });
    }

    // Add application
    internship.applicants.push({
      user: req.user.id,
      coverLetter: req.body.coverLetter
    });

    await internship.save();

    res.json({
      success: true,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Apply internship error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not submit application'
    });
  }
};

// @desc    Get my posted opportunities (for alumni)
// @route   GET /api/internships/my-posts
// @access  Private (Alumni, Placement)
exports.getMyPosts = async (req, res) => {
  try {
    const internships = await Internship.find({ postedBy: req.user.id })
      .setOptions({ _skipDeadlineFilter: true })
      .sort({ createdAt: -1 })
      .populate('applicants.user', 'name email profileImage branch batchEnd');

    res.json({
      success: true,
      data: internships
    });
  } catch (error) {
    console.error('Get my posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch your opportunities'
    });
  }
};

// @desc    Get applications for an opportunity
// @route   GET /api/internships/:id/applications
// @access  Private (Owner only)
exports.getApplications = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id)
      .populate('applicants.user', 'name email profileImage branch batchEnd skills bio');

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    // Check ownership
    if (internship.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.json({
      success: true,
      data: internship.applicants
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch applications'
    });
  }
};

// @desc    Update application status
// @route   PUT /api/internships/:id/applications/:userId
// @access  Private (Owner only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id, userId } = req.params;

    const internship = await Internship.findById(id);

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    // Check ownership
    if (internship.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Find and update application
    const application = internship.applicants.find(
      app => app.user.toString() === userId
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = status;
    await internship.save();

    res.json({
      success: true,
      message: 'Application status updated'
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update application'
    });
  }
};
