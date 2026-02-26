const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['internship', 'fulltime', 'referral', 'parttime', 'contract'],
    required: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  requirements: [{
    type: String,
    trim: true
  }],
  skills: [{
    type: String,
    trim: true
  }],
  location: {
    city: String,
    country: {
      type: String,
      default: 'India'
    },
    isRemote: {
      type: Boolean,
      default: false
    }
  },
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'INR'
    },
    isVisible: {
      type: Boolean,
      default: true
    }
  },
  duration: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months'],
      default: 'months'
    }
  },
  eligibility: {
    branches: [{
      type: String,
      enum: ['CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM', 'BT', 'IEM', 'AIML', 'DS', 'All']
    }],
    minBatch: Number,
    maxBatch: Number
  },
  applicationDeadline: Date,
  applyLink: String,
  applyEmail: String,
  status: {
    type: String,
    enum: ['active', 'closed', 'draft', 'expired'],
    default: 'active'
  },
  applicants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['applied', 'reviewed', 'shortlisted', 'rejected', 'selected'],
      default: 'applied'
    },
    coverLetter: String
  }],
  views: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
internshipSchema.index({ type: 1, status: 1, createdAt: -1 });
internshipSchema.index({ 'eligibility.branches': 1 });
internshipSchema.index({ company: 'text', title: 'text', skills: 'text' });

// Helper to escape regex special characters
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Auto-expire opportunities past deadline (skip if _skipDeadlineFilter is set)
internshipSchema.pre('find', function() {
  if (this.getOptions()._skipDeadlineFilter) return;
  this.where({
    $or: [
      { applicationDeadline: { $gte: new Date() } },
      { applicationDeadline: { $exists: false } }
    ]
  });
});

internshipSchema.pre('findOne', function() {
  if (this.getOptions()._skipDeadlineFilter) return;
  this.where({
    $or: [
      { applicationDeadline: { $gte: new Date() } },
      { applicationDeadline: { $exists: false } }
    ]
  });
});

// Static method to get opportunities with filters
internshipSchema.statics.getFiltered = async function(filters, page = 1, limit = 10) {
  const query = { status: 'active' };

  if (filters.type) query.type = filters.type;
  if (filters.branch) query['eligibility.branches'] = { $in: [filters.branch, 'All'] };
  if (filters.isRemote) query['location.isRemote'] = filters.isRemote === 'true';
  if (filters.company) query.company = new RegExp(escapeRegex(filters.company), 'i');

  const skip = (page - 1) * limit;

  const [opportunities, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('postedBy', 'name profileImage company designation'),
    this.countDocuments(query)
  ]);

  return {
    opportunities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = mongoose.model('Internship', internshipSchema);
