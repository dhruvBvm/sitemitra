const { param, check } = require('express-validator');

const getRequestByIdValidation = [
  param('requestId', 'Invalid request ID').isMongoId()
];

const ownerApproveRequestValidation = [
  param('requestId', 'Invalid request ID').isMongoId(),
  check('comment', 'Comment must be a string').optional().isString().trim().escape()
];

const ownerRejectRequestValidation = [
  param('requestId', 'Invalid request ID').isMongoId(),
  check('comment', 'Comment must be a string').optional().isString().trim().escape()
];

const updateRequestStatusValidation = [
  param('requestId', 'Invalid request ID').isMongoId(),
  check('status').isIn(['purchase_requested', 'delivered', 'closed']).withMessage('Invalid status update'),
  check('comment', 'Comment must be a string').optional().isString().trim().escape()
];

module.exports = {
  getRequestByIdValidation,
  ownerApproveRequestValidation,
  ownerRejectRequestValidation,
  updateRequestStatusValidation
};
