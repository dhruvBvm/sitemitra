const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { getBookmark, setBookmark } = require('./user.controller');
const { bookmarkValidator } = require('./user.validation');
const { validateRequest } = require('../../middleware/validate');

// Get current user profile
/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/profile', protect, (req, res) => {
  res.json(req.user);
});

// Get bookmarked site
router.get('/bookmark', protect, bookmarkValidator, validateRequest, getBookmark);

// Update bookmarked site
router.put('/bookmark', protect, bookmarkValidator, validateRequest, setBookmark);

module.exports = router;
