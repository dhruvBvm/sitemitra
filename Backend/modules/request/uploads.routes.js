const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const { uploadMaterialImages } = require('./upload.controller');

// Route: POST /api/uploads/material-images
/**
 * @swagger
 * /api/uploads/material-images:
 *   post:
 *     summary: Upload material images (up to 5)
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 5 image files
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 imageUrls:
 *                   type: array
 *                   items: { type: string }
 *                   example: ["https://cloudinary.com/example.jpg"]
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/material-images', protect, upload.array('images', 5), uploadMaterialImages);

module.exports = router;
