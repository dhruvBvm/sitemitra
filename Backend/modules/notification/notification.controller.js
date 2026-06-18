const Notification = require('../notification/notification.model');

// @desc    Get logged in user's notifications
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const ownerId = req.user.role === 'owner' ? req.user._id : req.user.parentUserId;

  try {
    const filter = { userId: req.user._id, ownerId };
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const notifications = await Notification.find(filter)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });
    const total = await Notification.countDocuments(filter);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  const ownerId = req.user.role === 'owner' ? req.user._id : req.user.parentUserId;
  try {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user._id, ownerId });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllRead = async (req, res) => {
  const ownerId = req.user.role === 'owner' ? req.user._id : req.user.parentUserId;
  try {
    await Notification.updateMany(
      { userId: req.user._id, ownerId, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllRead
};
