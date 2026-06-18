const { check, param } = require('express-validator');

const createManagerValidation = [
  check('name', 'Name is required').notEmpty().trim().escape(),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('mobile', 'Mobile number is required').isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits').trim().escape(),
  check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  check('assignedSites', 'assignedSites must be an array').optional().isArray(),
  check('assignedSites.*', 'Each site ID must be a valid MongoDB ID').optional().isMongoId(),
  check('siteId', 'siteId must be a valid MongoDB ID').optional().isMongoId()
];

const createStaffValidation = [
  check('name', 'Name is required').notEmpty().trim().escape(),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('mobile', 'Mobile number is required').isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits').trim().escape(),
  check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  check('assignedSites', 'assignedSites must be an array').optional().isArray(),
  check('assignedSites.*', 'Each site ID must be a valid MongoDB ID').optional().isMongoId(),
  check('siteId', 'siteId must be a valid MongoDB ID').optional().isMongoId()
];

const assignSitesValidation = [
  param('userId', 'Invalid user ID').isMongoId(),
  check('siteIds', 'siteIds is required and must be an array').isArray(),
  check('siteIds.*', 'Each site ID must be a valid MongoDB ID').isMongoId()
];

const updateStatusValidation = [
  param('userId', 'Invalid user ID').isMongoId(),
  check('status', 'Status must be active or inactive').isIn(['active', 'inactive'])
];

const assignStaffValidation = [
  check('managerId', 'managerId is required and must be a valid MongoDB ID').isMongoId()
];

const getUserByIdValidation = [
  param('userId', 'Invalid user ID').isMongoId()
];

const updateUserValidation = [
  param('userId', 'Invalid user ID').isMongoId(),
  check('name', 'Name must be a string').optional().notEmpty().trim().escape(),
  check('mobile', 'Mobile number cannot be empty').optional().isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits').trim().escape()
];

const deleteUserValidation = [
  param('userId', 'Invalid user ID').isMongoId()
];

const getManagerByIdValidation = [
  param('managerId', 'Invalid manager ID').isMongoId()
];

const updateManagerValidation = [
  param('managerId', 'Invalid manager ID').isMongoId(),
  check('name', 'Name must be a string').optional().notEmpty().trim().escape(),
  check('mobile', 'Mobile number cannot be empty').optional().isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits').trim().escape()
];

const deleteManagerValidation = [
  param('managerId', 'Invalid manager ID').isMongoId()
];

const assignStaffToManagerValidation = [
  param('staffId', 'Invalid staff ID').isMongoId(),
  check('managerId', 'managerId is required and must be a valid MongoDB ID').isMongoId()
];

module.exports = {
  createManagerValidation,
  createStaffValidation,
  assignSitesValidation,
  updateStatusValidation,
  assignStaffValidation,
  getUserByIdValidation,
  updateUserValidation,
  deleteUserValidation,
  getManagerByIdValidation,
  updateManagerValidation,
  deleteManagerValidation,
  assignStaffToManagerValidation
};
