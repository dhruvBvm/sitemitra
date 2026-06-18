const express = require('express');
const { check, param, validationResult } = require('express-validator');
const { protect } = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const {
  createSite,
  updateSite,
  getAllSites,
  getSiteById,

  deleteSite,
  assignManagerToSite
} = require('../site/site.controller');

const { validateRequest } = require('../../middleware/validate');
const {
  createSiteValidation,
  updateSiteValidation,
  getSiteByIdValidation,
  deleteSiteValidation,
  assignManagerValidation
} = require('./site.validation');

const router = express.Router();

// Apply JWT auth + owner role check to all routes
router.use(protect);
router.use(roleCheck('owner'));

// POST /api/owner/sites - Create a new site
/**
 * @swagger
 * /api/owner/sites:
 *   post:
 *     summary: POST /api/owner/sites
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
 *               siteName: { type: string }
 *               siteCode: { type: string }
 *               location: { type: string }
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
router.post('/', createSiteValidation, validateRequest, createSite);

// PUT /api/owner/sites/:siteId - Update a site
/**
 * @swagger
 * /api/owner/sites/{siteId}:
 *   put:
 *     summary: PUT /api/owner/sites/:siteId
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: siteId
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
 *               siteName: { type: string }
 *               location: { type: string }
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
router.put('/:siteId', updateSiteValidation, validateRequest, updateSite);

// GET /api/owner/sites - Get all sites
/**
 * @swagger
 * /api/owner/sites:
 *   get:
 *     summary: GET /api/owner/sites
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
router.get('/', getAllSites);

// GET /api/owner/sites/:siteId - Get site by ID
/**
 * @swagger
 * /api/owner/sites/{siteId}:
 *   get:
 *     summary: GET /api/owner/sites/:siteId
 *     tags: [Owner]
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
router.get(
  '/:siteId',
  getSiteByIdValidation,
  validateRequest,
  getSiteById
);

// DELETE /api/owner/sites/:siteId - Soft delete a site
/**
 * @swagger
 * /api/owner/sites/{siteId}:
 *   delete:
 *     summary: DELETE /api/owner/sites/:siteId
 *     tags: [Owner]
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
router.delete(
  '/:siteId',
  deleteSiteValidation,
  validateRequest,
  deleteSite
);

// Assign or unassign manager to site
/**
 * @swagger
 * /api/owner/sites/{siteId}/manager:
 *   put:
 *     summary: Assign or unassign a manager to a site
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
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
 *                 description: Manager user ID to assign (or null to unassign)
 *     responses:
 *       200:
 *         description: Manager assigned/unassigned
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
router.put('/:siteId/manager', assignManagerValidation, validateRequest, assignManagerToSite);

module.exports = router;
