const User = require('../models/User');
const Internship = require('../models/Internship');
const Mentorship = require('../models/Mentorship');
const Message = require('../models/Message');

// Helper to escape regex special characters
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private (Placement, Admin)
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const [
      userStats,
      internshipStats,
      mentorshipStats,
      recentAlumni,
      topCompanies,
      branchDistribution
    ] = await Promise.all([
      // User statistics
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),

      // Internship statistics
      Internship.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalApplicants: { $sum: { $size: '$applicants' } }
          }
        }
      ]),

      // Mentorship statistics
      Mentorship.getAnalytics(),

      // Recent alumni registrations
      User.find({ role: 'alumni' })
        .select('name profileImage company designation branch batchEnd createdAt')
        .sort({ createdAt: -1 })
        .limit(5),

      // Top companies by alumni count
      User.aggregate([
        { $match: { role: 'alumni', company: { $exists: true, $ne: '' } } },
        { $group: { _id: '$company', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Branch distribution
      User.aggregate([
        { $match: { role: 'alumni' } },
        { $group: { _id: '$branch', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    // Format user stats
    const users = {
      total: 0,
      students: 0,
      alumni: 0,
      placement: 0
    };
    userStats.forEach(stat => {
      users[stat._id] = stat.count;
      users.total += stat.count;
    });

    // Format internship stats
    const opportunities = {
      total: 0,
      byType: {},
      totalApplications: 0
    };
    internshipStats.forEach(stat => {
      opportunities.byType[stat._id] = stat.count;
      opportunities.total += stat.count;
      opportunities.totalApplications += stat.totalApplicants;
    });

    // Format mentorship stats
    const mentorships = {
      total: 0,
      byStatus: {}
    };
    mentorshipStats.forEach(stat => {
      mentorships.byStatus[stat._id] = stat.count;
      mentorships.total += stat.count;
    });

    res.json({
      success: true,
      data: {
        users,
        opportunities,
        mentorships,
        recentAlumni,
        topCompanies,
        branchDistribution
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch analytics'
    });
  }
};

// @desc    Get alumni by company
// @route   GET /api/analytics/companies
// @access  Private (Placement, Admin)
exports.getAlumniByCompany = async (req, res) => {
  try {
    const { company, page = 1, limit = 10 } = req.query;

    if (company) {
      // Get alumni from specific company
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [alumni, total] = await Promise.all([
        User.find({ 
          role: 'alumni', 
          company: new RegExp(escapeRegex(company), 'i') 
        })
          .select('name profileImage company designation branch batchEnd email')
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments({ 
          role: 'alumni', 
          company: new RegExp(escapeRegex(company), 'i') 
        })
      ]);

      return res.json({
        success: true,
        data: alumni,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    }

    // Get company list with counts
    const companies = await User.aggregate([
      { $match: { role: 'alumni', company: { $exists: true, $ne: '' } } },
      { $group: { _id: '$company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);

    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Get alumni by company error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch data'
    });
  }
};

// @desc    Get alumni by location
// @route   GET /api/analytics/locations
// @access  Private (Placement, Admin)
exports.getAlumniByLocation = async (req, res) => {
  try {
    const { country, city } = req.query;

    // Get location distribution
    const locations = await User.aggregate([
      { $match: { role: 'alumni', 'location.country': { $exists: true } } },
      {
        $group: {
          _id: {
            country: '$location.country',
            city: '$location.city'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 30 }
    ]);

    // Group by country
    const byCountry = await User.aggregate([
      { $match: { role: 'alumni', 'location.country': { $exists: true } } },
      { $group: { _id: '$location.country', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        locations,
        byCountry
      }
    });
  } catch (error) {
    console.error('Get alumni by location error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch data'
    });
  }
};

// @desc    Get batch-wise analytics
// @route   GET /api/analytics/batches
// @access  Private (Placement, Admin)
exports.getBatchAnalytics = async (req, res) => {
  try {
    // Get batch distribution
    const batchDistribution = await User.aggregate([
      { $match: { role: 'alumni' } },
      { $group: { _id: '$batchEnd', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 20 }
    ]);

    // Get placement trends (companies per batch)
    const placementTrends = await User.aggregate([
      { $match: { role: 'alumni', company: { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$batchEnd',
          companies: { $addToSet: '$company' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 1,
          uniqueCompanies: { $size: '$companies' },
          alumniCount: '$count'
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        batchDistribution,
        placementTrends
      }
    });
  } catch (error) {
    console.error('Get batch analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch data'
    });
  }
};

// @desc    Get engagement metrics
// @route   GET /api/analytics/engagement
// @access  Private (Placement, Admin)
exports.getEngagementMetrics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      activeUsers,
      messageCount,
      newConnections,
      newOpportunities
    ] = await Promise.all([
      // Active users in last 30 days
      User.countDocuments({
        lastActive: { $gte: thirtyDaysAgo }
      }),

      // Messages sent in last 30 days
      Message.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      }),

      // New registrations in last 30 days
      User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      }),

      // New opportunities posted in last 30 days
      Internship.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      })
    ]);

    // Daily activity trend
    const dailyActivity = await Message.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        last30Days: {
          activeUsers,
          messagesSent: messageCount,
          newUsers: newConnections,
          newOpportunities
        },
        dailyActivity
      }
    });
  } catch (error) {
    console.error('Get engagement metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch metrics'
    });
  }
};

// @desc    Export alumni data
// @route   GET /api/analytics/export
// @access  Private (Placement, Admin)
exports.exportAlumniData = async (req, res) => {
  try {
    const { branch, batchStart, batchEnd, company, format = 'json' } = req.query;

    const query = { role: 'alumni' };

    if (branch && branch !== 'All') query.branch = branch;
    if (batchStart) query.batchEnd = { $gte: parseInt(batchStart) };
    if (batchEnd) query.batchEnd = { ...query.batchEnd, $lte: parseInt(batchEnd) };
    if (company) query.company = new RegExp(escapeRegex(company), 'i');

    const alumni = await User.find(query)
      .select('name email branch batchStart batchEnd company designation location skills linkedinUrl')
      .sort({ batchEnd: -1 });

    if (format === 'csv') {
      // CSV escape helper to prevent CSV injection
      const csvEscape = (val) => {
        if (val == null) return '';
        const str = String(val);
        // Prefix with single quote if starts with =, +, -, @, \t, \r
        if (/^[=+\-@\t\r]/.test(str)) {
          return `"'${str.replace(/"/g, '""')}"`;
        }
        return `"${str.replace(/"/g, '""')}"`;
      };
      // Generate CSV
      const headers = ['Name', 'Email', 'Branch', 'Batch', 'Company', 'Designation', 'Location', 'Skills', 'LinkedIn'];
      const rows = alumni.map(a => [
        a.name,
        a.email,
        a.branch,
        `${a.batchStart}-${a.batchEnd}`,
        a.company || '',
        a.designation || '',
        a.location?.city ? `${a.location.city}, ${a.location.country}` : '',
        a.skills?.join('; ') || '',
        a.linkedinUrl || ''
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.map(csvEscape).join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=alumni-data.csv');
      return res.send(csv);
    }

    res.json({
      success: true,
      count: alumni.length,
      data: alumni
    });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not export data'
    });
  }
};
