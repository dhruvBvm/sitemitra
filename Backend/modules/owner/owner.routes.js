const express = require('express');
const { check, validationResult } = require('express-validator');
const { protect } = require('../../middleware/auth');
const ownerOnly = require('../../middleware/ownerOnly');
const {
  createManager,
  createStaff,
  assignSitesToUser,
  getAllUsers,
  getUserById,
  updateUserStatus,
  assignStaffToManager,
  updateManager,
  deleteManager,
  updateUser,
  deleteUser,
  getDashboardStats,

  getMonthlyOrders,
  getStatusBreakdown
} = require('../owner/owner.controller');

const { validateRequest } = require('../../middleware/validate');
const {
  createManagerValidation,
  createStaffValidation,
  assignSitesValidation,
  updateStatusValidation,
  assignStaffValidation,
  getUserByIdValidation,
  updateUserValidation,
  deleteUserValidation,
  getManagerByIdValidation,
  updateManagerValidation,
  deleteManagerValidation,
  assignStaffToManagerValidation
} = require('./owner.validation');

const router = express.Router();

// Apply protect and owner role restriction to all owner routes
router.use(protect);
router.use(ownerOnly);

// Define routes  
/**
 * @swagger
 * /api/owner/manager:
 *   post:
 *     summary: Create a new manager (legacy endpoint)
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - mobile
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Manager Name"
 *               email:
 *                 type: string
 *                 example: "manager@example.com"
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               assignedSites:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60d0fe4f5311236168a109cb"]
 *     responses:
 *       201:
 *         description: Manager created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post('/manager', createManagerValidation, validateRequest, createManager);
// New routes with /users prefix (preferred)
/**
 * @swagger
 * /api/owner/users/manager:
 *   post:
 *     summary: POST /api/owner/users/manager
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               mobile: { type: string }
 *               password: { type: string }
 *               assignedSites:
 *                 type: array
 *                 items: { type: string }
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
router.post('/users/manager', createManagerValidation, validateRequest, createManager);
/**
 * @swagger
 * /api/owner/users/staff:
 *   post:
 *     summary: POST /api/owner/users/staff
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               mobile: { type: string }
 *               password: { type: string }
 *               assignedSites:
 *                 type: array
 *                 items: { type: string }
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
router.post('/users/staff', createStaffValidation, validateRequest, createStaff);
/**
 * @swagger
 * /api/owner/users/{userId}/sites:
 *   put:
 *     summary: PUT /api/owner/users/:userId/sites
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               siteIds:
 *                 type: array
 *                 items: { type: string }
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
router.put('/users/:userId/sites', assignSitesValidation, validateRequest, assignSitesToUser);
/**
 * @swagger
 * /api/owner/users/{staffId}/manager:
 *   put:
 *     summary: PUT /api/owner/users/:staffId/manager
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               managerId: { type: string }
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
router.put('/users/:staffId/manager', assignStaffToManagerValidation, validateRequest, assignStaffToManager);
/**
 * @swagger
 * /api/owner/users/{userId}:
 *   put:
 *     summary: PUT /api/owner/users/:userId
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               mobile: { type: string }
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
router.put('/users/:userId', updateUserValidation, validateRequest, updateUser);
/**
 * @swagger
 * /api/owner/users/{userId}:
 *   delete:
 *     summary: DELETE /api/owner/users/:userId
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
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
router.delete('/users/:userId', deleteUserValidation, validateRequest, deleteUser);
/**
 * @swagger
 * /api/owner/users/{userId}/status:
 *   put:
 *     summary: PUT /api/owner/users/:userId/status
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: ['active', 'inactive'] }
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
router.put('/users/:userId/status', updateStatusValidation, validateRequest, updateUserStatus);
/**
 * @swagger
 * /api/owner/staff:
 *   post:
 *     summary: Create a new staff (legacy endpoint)
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - mobile
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Staff Name"
 *               email:
 *                 type: string
 *                 example: "staff@example.com"
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               assignedSites:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60d0fe4f5311236168a109cb"]
 *     responses:
 *       201:
 *         description: Staff created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post('/staff', createStaffValidation, validateRequest, createStaff);
/**
 * @swagger
 * /api/owner/user/{userId}/sites:
 *   put:
 *     summary: Assign sites to user (legacy endpoint)
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - siteIds
 *             properties:
 *               siteIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60d0fe4f5311236168a109cb"]
 *     responses:
 *       200:
 *         description: Sites assigned
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/user/:userId/sites', assignSitesValidation, validateRequest, assignSitesToUser);
/**
 * @swagger
 * /api/owner/staff/{staffId}/manager:
 *   put:
 *     summary: Assign staff to a manager (legacy endpoint)
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - managerId
 *             properties:
 *               managerId:
 *                 type: string
 *                 example: "60d0fe4f5311236168a109ca"
 *     responses:
 *       200:
 *         description: Staff assigned to manager
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/staff/:staffId/manager', assignStaffToManagerValidation, validateRequest, assignStaffToManager);
/**
 * @swagger
 * /api/owner/users:
 *   get:
 *     summary: GET /api/owner/users
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
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
router.get('/users', getAllUsers);
/**
 * @swagger
 * /api/owner/users/{userId}:
 *   get:
 *     summary: GET /api/owner/users/:userId
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
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
router.get('/users/:userId', getUserByIdValidation, validateRequest, getUserById);
/**
 * @swagger
 * /api/owner/users/{userId}/status:
 *   put:
 *     summary: PUT /api/owner/users/:userId/status
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: ['active', 'inactive'] }
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
router.put('/users/:userId/status', updateStatusValidation, validateRequest, updateUserStatus);
// Manager CRUD routes (owner)
/**
 * @swagger
 * /api/owner/manager/{managerId}:
 *   get:
 *     summary: GET /api/owner/manager/:managerId
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: managerId
 *         required: true
 *         schema:
 *           type: string
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
router.get('/manager/:managerId', getManagerByIdValidation, validateRequest, getUserById);
/**
 * @swagger
 * /api/owner/manager/{managerId}:
 *   put:
 *     summary: PUT /api/owner/manager/:managerId
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: managerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               mobile: { type: string }
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
router.put('/manager/:managerId', updateManagerValidation, validateRequest, updateManager);
/**
 * @swagger
 * /api/owner/manager/{managerId}:
 *   delete:
 *     summary: DELETE /api/owner/manager/:managerId
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: managerId
 *         required: true
 *         schema:
 *           type: string
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
router.delete('/manager/:managerId', deleteManagerValidation, validateRequest, deleteManager);
// User CRUD routes (owner)
/**
 * @swagger
 * /api/owner/users/{userId}:
 *   put:
 *     summary: PUT /api/owner/users/:userId
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               mobile: { type: string }
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
router.put('/users/:userId', updateUserValidation, validateRequest, updateUser);
/**
 * @swagger
 * /api/owner/users/{userId}:
 *   delete:
 *     summary: DELETE /api/owner/users/:userId
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
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
router.delete('/users/:userId', deleteUserValidation, validateRequest, deleteUser);
// Dashboard stats route
/**
 * @swagger
 * /api/owner/reports/dashboard:
 *   get:
 *     summary: GET /api/owner/reports/dashboard
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
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
router.get('/reports/dashboard', getDashboardStats);
/**
 * @swagger
 * /api/owner/reports/monthly:
 *   get:
 *     summary: GET /api/owner/reports/monthly
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
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
router.get('/reports/monthly', getMonthlyOrders);
/**
 * @swagger
 * /api/owner/reports/status-breakdown:
 *   get:
 *     summary: GET /api/owner/reports/status-breakdown
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
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
router.get('/reports/status-breakdown', getStatusBreakdown);
module.exports = router;
