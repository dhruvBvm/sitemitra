const Notification = require('../modules/notification/notification.model');
const User = require('../modules/user/user.model');

/**
 * Helper to create a notification for a user
 * @param {ObjectId|String} userId - User to notify
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 */
const createNotification = async (userId, title, message) => {
  try {
    if (!userId) return; // Skip if no user provided
    
    // Resolve ownerId from target user
    const targetUser = await User.findById(userId);
    if (!targetUser) return;

    let ownerId = targetUser.role === 'owner' ? targetUser._id : (targetUser.ownerId || targetUser.parentUserId);
    
    if (!ownerId) {
      console.warn('Could not resolve ownerId for user:', userId);
      return;
    }

    await Notification.create({ userId, ownerId, title, message });
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
};

module.exports = { createNotification };
