const { check, param } = require('express-validator');

const assignManagerValidator = [
  param('siteId').isMongoId(),
  check('managerId').optional({ nullable: true, checkFalsy: true }).isMongoId()
];

const createStaffValidator = [
  check('name').notEmpty().withMessage('Name is required').trim().escape(),
  check('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  check('mobile').isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  check('assignedSites').optional().isArray().withMessage('assignedSites must be an array'),
  check('assignedSites.*').optional().isMongoId().withMessage('Each site ID must be a valid MongoDB ID'),
  check('siteId').optional().isMongoId().withMessage('siteId must be a valid MongoDB ID')
];

const getTeamMemberValidator = [
  param('staffId').isMongoId()
];

const updateStaffStatusValidator = [
  param('staffId').isMongoId(),
  check('status').isIn(['active', 'inactive']).withMessage('Status must be active or inactive')
];

const updateTeamMemberValidator = [
  param('staffId').isMongoId(),
  check('name').optional().trim().escape(),
  check('email').optional().isEmail().normalizeEmail(),
  check('mobile').optional().isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits'),
  check('assignedSites').optional().isArray().withMessage('assignedSites must be an array'),
  check('assignedSites.*').optional().isMongoId().withMessage('Each site ID must be a valid MongoDB ID')
];

const deleteTeamMemberValidator = [
  param('staffId').isMongoId()
];

const assignSitesToTeamStaffValidator = [
  param('staffId').isMongoId(),
  check('siteIds').isArray().withMessage('siteIds must be an array'),
  check('siteIds.*').isMongoId().withMessage('Each site ID must be a valid MongoDB ID')
];

const getRequestByIdValidator = [
  param('requestId').isMongoId()
];

const managerApproveRequestValidator = [
  param('requestId').isMongoId(),
  check('comment').optional().trim().escape(),
  check('approveNotes').optional().trim().escape()
];

const managerRejectRequestValidator = [
  param('requestId').isMongoId(),
  check('comment').optional().trim().escape()
];

const updateRequestStatusValidator = [
  param('requestId').isMongoId(),
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
