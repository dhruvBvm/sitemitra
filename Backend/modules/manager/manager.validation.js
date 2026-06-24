const { check, param } = require('express-validator');

const assignManagerValidator = [
  param('siteId').isMongoId().withMessage('Valid site ID is required'),
  check('managerId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Valid manager ID is required')
];

const createStaffValidator = [
  check('name').notEmpty().withMessage('Name is required').trim().escape(),
  check('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  check('mobile').isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits').trim().escape(),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  check('assignedSites').optional().isArray().withMessage('assignedSites must be an array'),
  check('assignedSites.*').optional().isMongoId().withMessage('Each site ID must be a valid MongoDB ID'),
  check('siteId').optional().isMongoId().withMessage('siteId must be a valid MongoDB ID')
];

const getTeamMemberValidator = [
  param('staffId').isMongoId().withMessage('Valid staff ID is required')
];

const updateStaffStatusValidator = [
  param('staffId').isMongoId().withMessage('Valid staff ID is required'),
  check('status').isIn(['active', 'inactive']).withMessage('Status must be active or inactive')
];

const updateTeamMemberValidator = [
  param('staffId').isMongoId().withMessage('Valid staff ID is required'),
  check('name').optional().trim().escape(),
  check('email').optional().isEmail().normalizeEmail(),
  check('mobile').optional().isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits').trim().escape(),
  check('assignedSites').optional().isArray().withMessage('assignedSites must be an array'),
  check('assignedSites.*').optional().isMongoId().withMessage('Each site ID must be a valid MongoDB ID')
];

const deleteTeamMemberValidator = [
  param('staffId').isMongoId().withMessage('Valid staff ID is required')
];

const assignSitesToTeamStaffValidator = [
  param('staffId').isMongoId().withMessage('Valid staff ID is required'),
  check('siteIds').isArray().withMessage('siteIds must be an array'),
  check('siteIds.*').isMongoId().withMessage('Each site ID must be a valid MongoDB ID')
];

const getRequestByIdValidator = [
  param('requestId').isMongoId().withMessage('Valid request ID is required')
];

const managerApproveRequestValidator = [
  param('requestId').isMongoId().withMessage('Valid request ID is required'),
  check('comment').optional().trim().escape(),
  check('approveNotes').optional().trim().escape()
];

const managerRejectRequestValidator = [
  param('requestId').isMongoId().withMessage('Valid request ID is required'),
  check('comment').optional().trim().escape()
];

const updateRequestStatusValidator = [
  param('requestId').isMongoId().withMessage('Valid request ID is required'),
  check('status').isIn(['purchase_requested', 'delivered', 'closed']).withMessage('Invalid status update'),
  check('comment').optional().trim().escape()
];

module.exports = {
  assignManagerValidator,
  createStaffValidator,
  getTeamMemberValidator,
  updateStaffStatusValidator,
  updateTeamMemberValidator,
  deleteTeamMemberValidator,
  assignSitesToTeamStaffValidator,
  getRequestByIdValidator,
  managerApproveRequestValidator,
  managerRejectRequestValidator,
  updateRequestStatusValidator
};
