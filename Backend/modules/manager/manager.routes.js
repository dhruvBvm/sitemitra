const express = require('express');
const { protect } = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const {
  createStaffForTeam,
  getMyTeam,
  updateStaffStatus,
  getManagerSites,
  updateTeamMember,
  deleteTeamMember,
  assignSitesToTeamStaff,
  getAllOwnerStaff,
  getTeamMemberById,
  getDashboardStats
} = require('../manager/manager.controller');
const { assignManagerToSite } = require('../site/site.controller');
const { getTeamRequests, managerApproveRequest, managerRejectRequest, updateRequestStatus, getRequestById } = require('../request/request.controller');
const { validateRequest } = require('../../middleware/validate');
const {
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
} = require('./manager.validation');

const router = express.Router();

router.use(protect);
router.use(roleCheck('manager'));

// Dashboard Stats
router.get('/dashboard-stats', getDashboardStats);

// Sites
/**
 * @swagger
 * /api/manager/sites:
 *   get:
 *     summary: GET /api/manager/sites
 *     tags: [Manager]
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
router.get('/sites', getManagerSites);
/**
 * @swagger
 * /api/manager/sites/{siteId}/manager:
 *   put:
 *     summary: Assign manager to site
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: The site ID
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
 *                 description: The ID of the manager to assign
 *     responses:
 *       200:
 *         description: Manager assigned to site
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Site not found
 *       500:
 *         description: Server error
 */
router.put('/sites/:siteId/manager', assignManagerValidator, validateRequest, assignManagerToSite);

// Staff
/**
 * @swagger
 * /api/manager/staff:
 *   post:
 *     summary: Create a new staff member for manager's team
 *     tags: [Manager]
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
 *               - assignedSites
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Staff"
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
 *         description: Staff member created
 *       400:
 *         description: Bad request or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post('/staff', createStaffValidator, validateRequest, createStaffForTeam);
/**
 * @swagger
 * /api/manager/staff/all:
 *   get:
 *     summary: GET /api/manager/staff/all
 *     tags: [Manager]
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
router.get('/staff/all', getAllOwnerStaff);
/**
 * @swagger
 * /api/manager/team:
 *   get:
 *     summary: GET /api/manager/team
 *     tags: [Manager]
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
router.get('/team', getMyTeam);
/**
 * @swagger
 * /api/manager/team/{staffId}:
 *   get:
 *     summary: GET /api/manager/team/:staffId
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: staffId
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
router.get('/team/:staffId', getTeamMemberValidator, validateRequest, getTeamMemberById);
/**
 * @swagger
 * /api/manager/staff/{staffId}/status:
 *   put:
 *     summary: Update staff member status (activate/deactivate)
 *     tags: [Manager]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: "inactive"
 *     responses:
 *       200:
 *         description: Staff status updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Server error
 */
router.put('/staff/:staffId/status', updateStaffStatusValidator, validateRequest, updateStaffStatus);
/**
 * @swagger
 * /api/manager/team/{staffId}:
 *   put:
 *     summary: Update a team member's details
 *     tags: [Manager]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Name"
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               email:
 *                 type: string
 *                 example: "updated@example.com"
 *     responses:
 *       200:
 *         description: Team member updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Server error
 */
router.put('/team/:staffId', updateTeamMemberValidator, validateRequest, updateTeamMember);
/**
 * @swagger
 * /api/manager/team/{staffId}:
 *   delete:
 *     summary: DELETE /api/manager/team/:staffId
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: staffId
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
router.delete('/team/:staffId', deleteTeamMemberValidator, validateRequest, deleteTeamMember);
/**
 * @swagger
 * /api/manager/team/{staffId}/sites:
 *   put:
 *     summary: Assign sites to a team staff member
 *     tags: [Manager]
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
 *               - siteIds
 *             properties:
 *               siteIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60d0fe4f5311236168a109cb"]
 *     responses:
 *       200:
 *         description: Sites assigned to staff
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Server error
 */
router.put('/team/:staffId/sites', assignSitesToTeamStaffValidator, validateRequest, assignSitesToTeamStaff);

// Manager Request routes
/**
 * @swagger
 * /api/manager/requests:
 *   get:
 *     summary: GET /api/manager/requests
 *     tags: [Manager]
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
router.get('/requests', getTeamRequests);
/**
 * @swagger
 * /api/manager/requests/{requestId}:
 *   get:
 *     summary: GET /api/manager/requests/:requestId
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: requestId
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
router.get('/requests/:requestId', getRequestByIdValidator, validateRequest, getRequestById);
/**
 * @swagger
 * /api/manager/requests/{requestId}/approve:
 *   put:
 *     summary: Manager approves a request
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 example: "Looks good, approved."
 *               approveNotes:
 *                 type: string
 *                 example: "Verified quantities."
 *     responses:
 *       200:
 *         description: Request approved and forwarded to owner
 *       400:
 *         description: Invalid request status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to approve
 *       404:
 *         description: Request not found
 *       500:
 *         description: Server error
 */
router.put('/requests/:requestId/approve', managerApproveRequestValidator, validateRequest, managerApproveRequest);
/**
 * @swagger
 * /api/manager/requests/{requestId}/reject:
 *   put:
 *     summary: Manager rejects a request
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 example: "Budget exceeded, rejecting."
 *     responses:
 *       200:
 *         description: Request rejected
 *       400:
 *         description: Invalid request status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to reject
 *       404:
 *         description: Request not found
 *       500:
 *         description: Server error
 */
router.put('/requests/:requestId/reject', managerRejectRequestValidator, validateRequest, managerRejectRequest);
/**
 * @swagger
 * /api/manager/requests/{requestId}/status:
 *   put:
 *     summary: Update request status (purchase_requested, delivered, closed)
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [purchase_requested, delivered, closed]
 *                 example: "delivered"
 *               comment:
 *                 type: string
 *                 example: "Materials delivered to site."
 *     responses:
 *       200:
 *         description: Request status updated
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Request not found
 *       500:
 *         description: Server error
 */
router.put('/requests/:requestId/status', updateRequestStatusValidator, validateRequest, updateRequestStatus);

module.exports = router;
