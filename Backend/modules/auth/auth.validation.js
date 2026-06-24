const { check } = require('express-validator');

const registerValidator = [
  check('name').notEmpty().withMessage('Name is required').trim().escape(),
  check('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  check('mobile').isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits').trim().escape(),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const registerOwnerValidator = [
  check('name').notEmpty().withMessage('Name is required').trim().escape(),
  check('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  check('mobile').isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits').trim().escape(),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidator = [
  check('loginId').notEmpty().withMessage('Login ID is required').trim().escape(),
  check('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidator = [
  check('loginId').notEmpty().withMessage('Login ID is required').trim().escape()
];

const resetPasswordValidator = [
  check('loginId').notEmpty().withMessage('Login ID is required').trim().escape(),
  check('otp').notEmpty().withMessage('OTP is required').trim().escape(),
  check('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

module.exports = {
  registerValidator,
  registerOwnerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator
};
