const mongoose = require('mongoose');

const mentorshipSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true,
    maxlength: [200, 'Topic cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  areas: [{
    type: String,
    enum: [
      'career-guidance',
      'interview-prep',
      'resume-review',
      'higher-studies',
      'job-referral',
      'skill-development',
      'startup-advice',
      'other'
    ]
  }],
  preferredMode: {
    type: String,
    enum: ['chat', 'video-call', 'in-person', 'any'],
    default: 'any'
  },
  availability: {
    type: String,
    maxlength: [200, 'Availability description cannot exceed 200 characters']
  },
  responseMessage: {
    type: String,
    maxlength: [500, 'Response message cannot exceed 500 characters']
  },
  respondedAt: Date,
  sessions: [{
    scheduledAt: Date,
    duration: Number, // in minutes
    notes: String,
    isCompleted: {
      type: Boolean,
      default: false
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String
    }
  }],
  rating: {
    mentorRating: {
      type: Number,
      min: 1,
      max: 5
    },
    studentRating: {
      type: Number,
      min: 1,
      max: 5
    }
  }
}, {
  timestamps: true
});

// Indexes
mentorshipSchema.index({ student: 1, mentor: 1 });
mentorshipSchema.index({ status: 1, createdAt: -1 });
mentorshipSchema.index({ mentor: 1, status: 1 });

// Prevent duplicate pending requests
mentorshipSchema.index(
  { student: 1, mentor: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

// Static method to get requests for a mentor
mentorshipSchema.statics.getMentorRequests = async function(mentorId, status = null) {
  const query = { mentor: mentorId };
  if (status) query.status = status;

  return await this.find(query)
    .sort({ createdAt: -1 })
    .populate('student', 'name email profileImage branch batchStart batchEnd');
};

// Static method to get requests from a student
mentorshipSchema.statics.getStudentRequests = async function(studentId, status = null) {
  const query = { student: studentId };
  if (status) query.status = status;

  return await this.find(query)
    .sort({ createdAt: -1 })
    .populate('mentor', 'name email profileImage company designation');
};

// Static method for analytics
mentorshipSchema.statics.getAnalytics = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Mentorship', mentorshipSchema);
