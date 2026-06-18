const { check, param } = require('express-validator');

const createSiteValidation = [
  check('siteName', 'Site name is required').notEmpty().trim().escape(),
  check('siteCode', 'Site code is required').notEmpty().trim().escape(),
  check('address', 'Address is required').notEmpty().trim().escape(),
  check('managerId', 'Manager ID must be a valid MongoDB ID').optional().isMongoId()
];

const updateSiteValidation = [
  param('siteId', 'Invalid site ID').isMongoId(),
  check('siteName', 'Site name cannot be empty').optional().notEmpty().trim().escape(),
  check('siteCode', 'Site code cannot be empty').optional().notEmpty().trim().escape(),
  check('address', 'Address cannot be empty').optional().notEmpty().trim().escape(),
  check('managerId', 'Manager ID must be a valid MongoDB ID').optional().isMongoId(),
  check('status', 'Status must be active or inactive').optional().isIn(['active', 'inactive'])
];

const getSiteByIdValidation = [
  param('siteId', 'Invalid site ID').isMongoId()
];

const deleteSiteValidation = [
  param('siteId', 'Invalid site ID').isMongoId()
];

const assignManagerValidation = [
  param('siteId', 'Invalid site ID').isMongoId(),
  // managerId can be a valid Mongo ID or null to unassign
  check('managerId')
  .optional({ nullable: true })
  .custom((value, { req }) => {
    if (req.user && req.user.role === 'owner') {
      return true;
    }
    const mongoose = require('mongoose');
    return mongoose.Types.ObjectId.isValid(value);
  })
  .withMessage('managerId must be a valid Mongo ID or null')
];

module.exports = {
  createSiteValidation,
  updateSiteValidation,
  getSiteByIdValidation,
  deleteSiteValidation,
  assignManagerValidation
};
