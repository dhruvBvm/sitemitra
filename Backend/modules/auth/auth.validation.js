const { check } = require('express-validator');

const registerValidator = [
  check('name').notEmpty().withMessage('Name is required').trim().escape(),
  check('email').isEmail().normalizeEmail(),
  check('mobile').isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits'),
  check('password').isLength({ min: 6 })
];

const registerOwnerValidator = [
  check('name').notEmpty().withMessage('Name is required').trim().escape(),
  check('email').isEmail().normalizeEmail(),
  check('mobile').isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits'),
  check('password').isLength({ min: 6 })
];

const loginValidator = [
  check('loginId').notEmpty().trim().escape(),
  check('password').notEmpty()
];

const forgotPasswordValidator = [
  check('loginId').notEmpty().trim().escape()
];

const resetPasswordValidator = [
  check('loginId').notEmpty().withMessage('Login ID is required').trim().escape(),
  check('otp').notEmpty().trim().escape(),
  check('newPassword').isLength({ min: 6 })
];

module.exports = {
  registerValidator,
  registerOwnerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator
};
