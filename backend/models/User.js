const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  
  // Role & Verification
  role: {
    type: String,
    enum: ['student', 'alumni', 'placement', 'admin'],
    default: 'student'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpire: Date,

  // Profile Image
  profileImage: {
    type: String,
    default: 'default-avatar.png'
  },

  // Academic Information
  branch: {
    type: String,
    enum: [
      'CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 
      'CHEM', 'BT', 'IEM', 'AIML', 'DS', 'Other'
    ],
    required: true
  },
  batchStart: {
    type: Number,
    required: true,
    min: 1963,
    max: new Date().getFullYear()
  },
  batchEnd: {
    type: Number,
    required: true,
    validate: {
      validator: function(value) {
        return value >= this.batchStart;
      },
      message: 'Batch end year must be after start year'
    }
  },
  usn: {
    type: String,
    trim: true,
    uppercase: true
  },

  // Professional Information (for Alumni)
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  designation: {
    type: String,
    trim: true,
    maxlength: [100, 'Designation cannot exceed 100 characters']
  },
  location: {
    city: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  linkedinUrl: {
    type: String,
    trim: true
  },
  
  // Skills & Bio
  skills: [{
    type: String,
    trim: true
  }],
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },

  // Connections & Social
  connections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  connectionRequests: {
    sent: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      sentAt: { type: Date, default: Date.now }
    }],
    received: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      receivedAt: { type: Date, default: Date.now }
    }]
  },

  // Mentorship
  isAvailableForMentorship: {
    type: Boolean,
    default: false
  },
  mentorshipAreas: [{
    type: String,
    trim: true
  }],

  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // Notification Preferences
  notifications: {
    emailMessages: { type: Boolean, default: true },
    emailConnections: { type: Boolean, default: true },
    emailOpportunities: { type: Boolean, default: true },
    emailMentorship: { type: Boolean, default: true },
    pushMessages: { type: Boolean, default: true },
    pushConnections: { type: Boolean, default: true }
  },

  // Privacy Settings
  privacy: {
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
    profileVisibility: {
      type: String,
      enum: ['public', 'connections', 'private'],
      default: 'public'
    }
  },

  // Activity
  lastActive: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for search optimization
userSchema.index({ name: 'text', company: 'text', skills: 'text' });
userSchema.index({ branch: 1, batchStart: 1, batchEnd: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'location.country': 1, 'location.city': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      role: this.role,
      email: this.email 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Generate verification token
userSchema.methods.generateVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.verificationToken;
  delete userObject.verificationTokenExpire;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpire;
  delete userObject.connectionRequests;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
