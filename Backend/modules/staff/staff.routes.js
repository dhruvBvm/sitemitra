const express = require('express');
const { protect } = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const { getAvailableMaterials, getAssignedSites, getSiteDetails } = require('../staff/staff.controller');
const { createManualRequest, createPhotoRequest, getMyRequests, getRequestById } = require('../request/request.controller');
const upload = require('../../middleware/upload');
const { validateRequest } = require('../../middleware/validate');
const {
  getSiteDetailsValidation,
  createManualRequestValidation,
  createPhotoRequestValidation,
  getRequestByIdValidation
} = require('./staff.validation');

const router = express.Router();

router.use(protect);
// Assuming this is staff-specific for now, but could be opened up
// router.use(roleCheck('staff')); // Removed to allow all roles to create orders
/**
 * @swagger
 * /api/staff/sites:
 *   get:
 *     summary: GET /api/staff/sites
 *     tags: [Staff]
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
router.get('/sites', getAssignedSites);
/**
 * @swagger
 * /api/staff/sites/{siteId}:
 *   get:
 *     summary: GET /api/staff/sites/:siteId
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: siteId
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
router.get('/sites/:siteId', getSiteDetailsValidation, validateRequest, getSiteDetails);
/**
 * @swagger
 * /api/staff/materials:
 *   get:
 *     summary: GET /api/staff/materials
 *     tags: [Staff]
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
router.get('/materials', getAvailableMaterials);

// Staff Request routes
/**
 * @swagger
 * /api/staff/requests/manual:
 *   post:
 *     summary: POST /api/staff/requests/manual
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               siteId: { type: string }
 *               notes: { type: string }
 *               materials:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     materialId: { type: string }
 *                     requestedQty: { type: number }
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
router.post('/requests/manual', createManualRequestValidation, validateRequest, createManualRequest);
/**
 * @swagger
 * /api/staff/requests/photo:
 *   post:
 *     summary: Create a photo-based material request
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - siteId
 *             properties:
 *               siteId:
 *                 type: string
 *                 description: Site ID
 *               notes:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               orderImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 5 order images
 *               materials:
 *                 type: string
 *                 description: JSON stringified array of materials
 *     responses:
 *       201:
 *         description: Photo request created
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - site not assigned
 *       500:
 *         description: Server error
 */
router.post('/requests/photo', upload.any(), createPhotoRequestValidation, validateRequest, createPhotoRequest);
/**
 * @swagger
 * /api/staff/requests:
 *   get:
 *     summary: GET /api/staff/requests
 *     tags: [Staff]
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
router.get('/requests', getMyRequests);
/**
 * @swagger
 * /api/staff/requests/{requestId}:
 *   get:
 *     summary: GET /api/staff/requests/:requestId
 *     tags: [Staff]
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
router.get('/requests/:requestId', getRequestByIdValidation, validateRequest, getRequestById);

module.exports = router;
