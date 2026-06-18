const express = require('express');
const { protect } = require('../../middleware/auth');
const {
  getMyNotifications,
  markAsRead,
  markAllRead
} = require('../notification/notification.controller');

const { validateRequest } = require('../../middleware/validate');
const { markAsReadValidator } = require('./notification.validation');
const { param } = require('express-validator');

const router = express.Router();

router.use(protect); // Available to all authenticated users

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: GET /api/notifications
 *     tags: [Notifications]
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
router.get('/', getMyNotifications);
/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/read-all', markAllRead);
/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.put('/:id/read', param('id').isMongoId(), markAsReadValidator, validateRequest, markAsRead);

module.exports = router;
