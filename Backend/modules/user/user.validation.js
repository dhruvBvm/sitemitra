const { check } = require('express-validator');

// Optional siteId for bookmarking a site. Must be a valid MongoDB ObjectId if provided.
const bookmarkValidator = [
  check('siteId')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('siteId must be a valid Mongo ID')
];

module.exports = {
  bookmarkValidator,
};
