const express = require('express');
const { protect } = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const {
  getAllRequests,
  getRequestById,
  ownerApproveRequest,
  ownerRejectRequest,
  updateRequestStatus
} = require('../request/request.controller');

const { validateRequest } = require('../../middleware/validate');
const { param } = require('express-validator');
const {
  getRequestByIdValidation,
  ownerApproveRequestValidation,
  ownerRejectRequestValidation,
  updateRequestStatusValidation
} = require('./request.validation');

const router = express.Router();

// Apply JWT auth + owner role check to all routes
router.use(protect);
router.use(roleCheck('owner'));

// GET /api/owner/requests - Get all requests with filters
/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: GET /api/requests
 *     tags: [Requests]
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
router.get('/', getAllRequests);

// GET /api/owner/requests/:requestId - Get request by ID
/**
 * @swagger
 * /api/requests/{requestId}:
 *   get:
 *     summary: GET /api/requests/:requestId
 *     tags: [Requests]
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
router.get(
  '/:requestId',
  param('requestId').isMongoId(),
  getRequestByIdValidation,
  validateRequest,
  getRequestById
);

// PUT /api/owner/requests/:requestId/approve - Approve an request
/**
 * @swagger
 * /api/requests/{requestId}/approve:
 *   put:
 *     summary: Owner approves a request
 *     tags: [Requests]
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
 *                 example: "Approved. Proceed with purchase."
 *               approveNotes:
 *                 type: string
 *                 example: "All items verified."
 *     responses:
 *       200:
 *         description: Request approved successfully
 *       400:
 *         description: Invalid request status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Request not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:requestId/approve',
  param('requestId').isMongoId(),
  ownerApproveRequestValidation,
  validateRequest,
  ownerApproveRequest
);

// PUT /api/owner/requests/:requestId/reject - Reject an request
/**
 * @swagger
 * /api/requests/{requestId}/reject:
 *   put:
 *     summary: Owner rejects a request
 *     tags: [Requests]
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
 *                 example: "Budget not available, rejected."
 *               rejectNotes:
 *                 type: string
 *                 example: "Try next quarter."
 *     responses:
 *       200:
 *         description: Request rejected
 *       400:
 *         description: Invalid request status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Request not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:requestId/reject',
  param('requestId').isMongoId(),
  ownerRejectRequestValidation,
  validateRequest,
  ownerRejectRequest
);

// PUT /api/owner/requests/:requestId/status - Update request status manually
/**
 * @swagger
 * /api/requests/{requestId}/status:
 *   put:
 *     summary: Update request status (purchase_requested, delivered, closed)
 *     tags: [Requests]
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
 *                 example: "Materials delivered."
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
router.put(
  '/:requestId/status',
  param('requestId').isMongoId(),
  updateRequestStatusValidation,
  validateRequest,
  updateRequestStatus
);

module.exports = router;
