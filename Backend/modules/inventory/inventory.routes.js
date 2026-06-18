const express = require('express');
const { protect } = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const {
  listSitesInventory,
  getSiteInventory,
  getMaterialHistory,
  createReceivedEntry,
  listReceivedEntries,
  getReceivedEntry,
  createUsedEntry,
  listUsedEntries,
  getUsedEntry,
  getMaterialStock
} = require('./inventory.controller');
const { param } = require('express-validator');
const { validateRequest } = require('../../middleware/validate');
const { createReceivedEntryValidator, createUsedEntryValidator } = require('./inventory.validation');

const router = express.Router();
router.use(protect);
/**
 * @swagger
 * /api/inventory/sites:
 *   get:
 *     summary: GET /api/inventory/sites
 *     tags: [Inventory]
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
router.get('/sites', roleCheck('owner', 'manager', 'staff'), listSitesInventory);
/**
 * @swagger
 * /api/inventory/stock:
 *   get:
 *     summary: GET /api/inventory/stock
 *     tags: [Inventory]
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
router.get('/stock', roleCheck('owner', 'manager', 'staff'), getMaterialStock);

// Moving /:siteId to bottom to prevent intercepting /received and /used

// Received Entries
/**
 * @swagger
 * /api/inventory/received:
 *   post:
 *     summary: POST /api/inventory/received
 *     tags: [Inventory]
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
 *               date: { type: string }
 *               notes: { type: string }
 *               requestId: { type: string }
 *               materials:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     materialId: { type: string }
 *                     quantity: { type: number }
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
router.post('/received', roleCheck('owner', 'manager', 'staff'), createReceivedEntryValidator, validateRequest, createReceivedEntry);
/**
 * @swagger
 * /api/inventory/received:
 *   get:
 *     summary: GET /api/inventory/received
 *     tags: [Inventory]
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
router.get('/received', roleCheck('owner', 'manager', 'staff'), listReceivedEntries);
/**
 * @swagger
 * /api/inventory/received/{entryId}:
 *   get:
 *     summary: GET /api/inventory/received/:entryId
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: entryId
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
router.get('/received/:entryId', roleCheck('owner', 'manager', 'staff'), param('entryId').isMongoId(), validateRequest, getReceivedEntry);

// Used Entries
/**
 * @swagger
 * /api/inventory/used:
 *   post:
 *     summary: POST /api/inventory/used
 *     tags: [Inventory]
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
 *               usedDate: { type: string }
 *               notes: { type: string }
 *               materials:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     materialId: { type: string }
 *                     qty: { type: number }
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
router.post('/used', roleCheck('owner', 'manager', 'staff'), createUsedEntryValidator, validateRequest, createUsedEntry);
/**
 * @swagger
 * /api/inventory/used:
 *   get:
 *     summary: GET /api/inventory/used
 *     tags: [Inventory]
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
router.get('/used', roleCheck('owner', 'manager', 'staff'), listUsedEntries);
/**
 * @swagger
 * /api/inventory/used/{entryId}:
 *   get:
 *     summary: GET /api/inventory/used/:entryId
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: entryId
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
router.get('/used/:entryId', roleCheck('owner', 'manager', 'staff'), param('entryId').isMongoId(), validateRequest, getUsedEntry);


/**
 * @swagger
 * /api/inventory/site/{siteId}:
 *   get:
 *     summary: GET /api/inventory/site/:siteId
 *     tags: [Inventory]
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
router.get('/site/:siteId', roleCheck('owner', 'manager', 'staff'), param('siteId').isMongoId(), validateRequest, getSiteInventory);
/**
 * @swagger
 * /api/inventory/{siteId}:
 *   get:
 *     summary: GET /api/inventory/:siteId
 *     tags: [Inventory]
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
router.get('/:siteId', roleCheck('owner', 'manager', 'staff'), param('siteId').isMongoId(), validateRequest, getSiteInventory);
/**
 * @swagger
 * /api/inventory/site/{siteId}/material/{materialId}/history:
 *   get:
 *     summary: GET /api/inventory/site/:siteId/material/:materialId/history
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: materialId
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
router.get('/site/:siteId/material/:materialId/history', roleCheck('owner', 'manager', 'staff'), param('siteId').isMongoId(), param('materialId').isMongoId(), validateRequest, getMaterialHistory);

module.exports = router;
