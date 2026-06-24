const { param } = require('express-validator');

const markAsReadValidator = [
  param('id').isMongoId().withMessage('Valid notification ID is required')
];

module.exports = {
  markAsReadValidator
};

