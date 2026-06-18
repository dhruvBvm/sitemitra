const User = require('./user.model');
const Site = require('../site/site.model');

// @desc    Get bookmarked site
// @route   GET /api/users/bookmark
// @access  Private
const getBookmark = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('bookmarkedSiteId');
    res.json({ success: true, site: user.bookmarkedSiteId || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update bookmarked site
// @route   PUT /api/users/bookmark
// @access  Private
const setBookmark = async (req, res) => {
  try {
    const { siteId } = req.body;
    let site = null;

    if (siteId) {
      const ownerId = req.user.role === 'owner' ? req.user._id : (req.user.ownerId || req.user.parentUserId);
      site = await Site.findOne({ _id: siteId, ownerId });
      if (!site) return res.status(404).json({ message: 'Site not found or not authorized' });

      if (req.user.role !== 'owner') {
        const assigned = req.user.assignedSites || [];
        const isAssigned = assigned.some(id => id && id.toString() === siteId.toString());
        const isManager = site.managerId && site.managerId.toString() === req.user._id.toString();
        if (!isAssigned && !isManager) {
          return res.status(403).json({ message: 'Site not assigned to user' });
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { bookmarkedSiteId: siteId || null },
      { new: true }
    );

    res.json({ success: true, bookmarkedSiteId: siteId || null });
  } catch (err) {
    console.error('Bookmark error:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getBookmark,
  setBookmark
};
