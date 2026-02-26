const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Registration validation
exports.validateRegistration = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain a number'),
  
  body('role')
    .optional()
    .isIn(['student', 'alumni']).withMessage('Invalid role'),
  
  body('branch')
    .notEmpty().withMessage('Branch is required')
    .isIn(['CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM', 'BT', 'IEM', 'AIML', 'DS', 'Other'])
    .withMessage('Invalid branch'),
  
  body('batchStart')
    .notEmpty().withMessage('Batch start year is required')
    .isInt({ min: 1963, max: new Date().getFullYear() })
    .withMessage('Invalid batch start year'),
  
  body('batchEnd')
    .notEmpty().withMessage('Batch end year is required')
    .isInt({ min: 1963 })
    .withMessage('Invalid batch end year')
    .custom((value, { req }) => {
      if (value < req.body.batchStart) {
        throw new Error('Batch end year must be after start year');
      }
      return true;
    })
];

// Login validation
exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Profile update validation
exports.validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Company name cannot exceed 100 characters'),
  
  body('designation')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Designation cannot exceed 100 characters'),
  
  body('skills')
    .optional()
    .isArray().withMessage('Skills must be an array')
    .custom((value) => {
      if (value.length > 20) {
        throw new Error('Maximum 20 skills allowed');
      }
      return true;
    }),
  
  body('linkedinUrl')
    .optional()
    .trim()
    .matches(/^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/)
    .withMessage('Please provide a valid LinkedIn URL')
];

// Message validation
exports.validateMessage = [
  body('content')
    .trim()
    .notEmpty().withMessage('Message content is required')
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
  
  param('receiverId')
    .isMongoId().withMessage('Invalid receiver ID')
];

// Internship validation
exports.validateInternship = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),
  
  body('company')
    .trim()
    .notEmpty().withMessage('Company name is required'),
  
  body('type')
    .notEmpty().withMessage('Opportunity type is required')
    .isIn(['internship', 'fulltime', 'referral', 'parttime', 'contract'])
    .withMessage('Invalid opportunity type'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),
  
  body('applicationDeadline')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    })
];

// Mentorship request validation
exports.validateMentorshipRequest = [
  body('topic')
    .trim()
    .notEmpty().withMessage('Topic is required')
    .isLength({ max: 200 }).withMessage('Topic cannot exceed 200 characters'),
  
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
  
  body('areas')
    .optional()
    .isArray().withMessage('Areas must be an array'),
  
  param('mentorId')
    .isMongoId().withMessage('Invalid mentor ID')
];

// Search/filter validation
exports.validateSearch = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  
  query('branch')
    .optional()
    .isIn(['CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM', 'BT', 'IEM', 'AIML', 'DS', 'Other', 'All'])
    .withMessage('Invalid branch'),
  
  query('batchStart')
    .optional()
    .isInt({ min: 1963 }).withMessage('Invalid batch start year'),
  
  query('batchEnd')
    .optional()
    .isInt({ min: 1963 }).withMessage('Invalid batch end year')
];

// MongoDB ObjectId validation
exports.validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId().withMessage(`Invalid ${paramName}`)
];
