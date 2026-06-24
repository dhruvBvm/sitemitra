const Material = require('../material/material.model');
const Site = require('../site/site.model');

// @desc    Get all active materials for dropdowns
// @route   GET /api/staff/materials
// @access  Private/Staff (and others if needed)
const getAvailableMaterials = async (req, res) => {
  try {
    const ownerId = req.user.role === 'owner' ? req.user._id : req.user.parentUserId;
    const materials = await Material.find({ status: 'active', ownerId }).select('materialName unit category');
    res.json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get assigned sites for current staff user
// @route   GET /api/staff/sites
// @access  Private/Staff
const getAssignedSites = async (req, res) => {
  try {
    const user = req.user;
    let query = { status: 'active' };
    if (user.role === 'owner') {
      query.ownerId = user._id;
    } else {
      query._id = { $in: user.assignedSites };
    }
    const sites = await Site.find(query).select('siteName siteCode address managerId').populate('managerId', 'name email');

    if (req.user && req.user.bookmarkedSiteId) {
      const bId = req.user.bookmarkedSiteId.toString();
      const index = sites.findIndex(s => s._id.toString() === bId);
      if (index > 0) {
        const bSite = sites.splice(index, 1)[0];
        sites.unshift(bSite);
      }
    }

    res.json({ success: true, data: sites });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get site details for staff
// @route   GET /api/staff/sites/:siteId
// @access  Private/Staff
const getSiteDetails = async (req, res) => {
  try {
    const user = req.user;
    const { siteId } = req.params;

    if (user.role !== 'owner' && !user.assignedSites.includes(siteId)) {
      return res.status(403).json({ message: 'Not authorized to access this site' });
    }

    const site = await Site.findById(siteId).populate('managerId', 'name email mobile role');
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    if (user.role === 'owner' && site.ownerId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this site' });
    }

    // Optional: fetch other staff assigned to this site
    const User = require('../user/user.model');
    const assignedStaff = await User.find({ role: 'staff', assignedSites: siteId }).select('name email mobile role');

    res.json({ success: true, data: { site, assignedStaff } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAvailableMaterials,
  getAssignedSites,
  getSiteDetails
};
