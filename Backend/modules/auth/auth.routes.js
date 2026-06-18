const express = require('express');
const router = express.Router();
const { registerOwner, register, login, forgotPassword, resetPassword, refresh, logout } = require('../auth/auth.controller');
const { validateRequest } = require('../../middleware/validate');
const {
  registerValidator,
  registerOwnerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator
} = require('./auth.validation');

// Public registration (staff only)
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: POST /api/auth/register
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Staff Name" }
 *               email: { type: string, example: "staff@example.com" }
 *               mobile: { type: string, example: "1234567890" }
 *               password: { type: string, example: "password123" }
 *               role: { type: string, example: "staff" }
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.post('/register', registerValidator, validateRequest, register);

// Owner initial registration (one-time use)
/**
 * @swagger
 * /api/auth/register-owner:
 *   post:
 *     summary: POST /api/auth/register-owner
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Owner Name" }
 *               email: { type: string, example: "owner@example.com" }
 *               mobile: { type: string, example: "1234567890" }
 *               password: { type: string, example: "password123" }
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.post('/register-owner', registerOwnerValidator, validateRequest, registerOwner);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: POST /api/auth/login
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, example: "user@example.com" }
 *               password: { type: string, example: "password123" }
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.post('/login', loginValidator, validateRequest, login);

// Token refresh and logout
/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: POST /api/auth/refresh
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.post('/refresh', refresh);
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and invalidate token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/logout', logout);

// Password reset
/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: POST /api/auth/forgot-password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, example: "user@example.com" }
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.post('/forgot-password', forgotPasswordValidator, validateRequest, forgotPassword);
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: POST /api/auth/reset-password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.post('/reset-password', resetPasswordValidator, validateRequest, resetPassword);

module.exports = router;
