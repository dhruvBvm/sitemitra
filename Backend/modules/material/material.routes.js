const express = require('express');
const { check, param, validationResult } = require('express-validator');
const { protect } = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const {
  createMaterial,
  updateMaterial,
  getAllMaterials,
  getMaterialById,
  deleteMaterial
} = require('../material/material.controller');

const { validateRequest } = require('../../middleware/validate');
const {
  createMaterialValidation,
  updateMaterialValidation,
  getMaterialByIdValidation,
  deleteMaterialValidation
} = require('./material.validation');

const router = express.Router();

// Apply JWT auth + owner role check to all routes
router.use(protect);
router.use(roleCheck('owner', 'manager', 'staff'));

// POST /api/owner/materials - Create a new material
/**
 * @swagger
 * /api/materials:
 *   post:
 *     summary: POST /api/materials
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               materialName: { type: string }
 *               unit: { type: string }
 *               category: { type: string }
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
router.post('/', createMaterialValidation, validateRequest, createMaterial);

// PUT /api/owner/materials/:materialId - Update a material
/**
 * @swagger
 * /api/materials/{materialId}:
 *   put:
 *     summary: Update a material
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: materialId
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
 *               materialName:
 *                 type: string
 *                 example: "Cement Bags (50kg)"
 *               unit:
 *                 type: string
 *                 example: "Bags"
 *               category:
 *                 type: string
 *                 example: "Building Materials"
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Material updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Material not found
 *       500:
 *         description: Server error
 */
router.put('/:materialId', updateMaterialValidation, validateRequest, updateMaterial);

// GET /api/owner/materials - Get all materials
/**
 * @swagger
 * /api/materials:
 *   get:
 *     summary: GET /api/materials
 *     tags: [Materials]
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
router.get('/', getAllMaterials);

// GET /api/owner/materials/:materialId - Get material by ID
/**
 * @swagger
 * /api/materials/{materialId}:
 *   get:
 *     summary: GET /api/materials/:materialId
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
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
router.get(
  '/:materialId',
  getMaterialByIdValidation,
  validateRequest,
  getMaterialById
);

// DELETE /api/owner/materials/:materialId - Soft delete a material
/**
 * @swagger
 * /api/materials/{materialId}:
 *   delete:
 *     summary: DELETE /api/materials/:materialId
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
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
router.delete(
  '/:materialId',
  deleteMaterialValidation,
  validateRequest,
  deleteMaterial
);

module.exports = router;
