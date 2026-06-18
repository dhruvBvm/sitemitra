const { param } = require('express-validator');

const markAsReadValidator = [
  param('id').isMongoId()
];

module.exports = {
  markAsReadValidator
};
