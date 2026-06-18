const Site = require('../site/site.model');
const User = require('../user/user.model');
const Inventory = require('../inventory/inventory.model');
const Material = require('../material/material.model');

// @desc    Create a new site
// @route   POST /api/owner/sites
// @access  Private/Owner
const createSite = async (req, res) => {
  const { siteName, siteCode, address, managerId } = req.body;

  try {
    if (managerId) {
      const managerUser = await User.findById(managerId);
      if (!managerUser || managerUser.role !== 'manager') {
        return res.status(400).json({ message: 'Assigned user must be a manager' });
      }
    }

    // Check uniqueness of siteCode
    const existing = await Site.findOne({ siteCode: siteCode.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'Site with this code already exists' });
    }

    const siteData = {
      ...req.body,
      siteCode: siteCode.toUpperCase(),
      managerId: managerId || null,
      ownerId: req.user._id
    };

    const site = await Site.create(siteData);

    // Create inventory for the new site with all active materials (quantity zero)
    try {
      const materials = await Material.find({ status: 'active', ownerId: req.user._id });
      const items = materials.map(m => ({
        materialId: m._id,
        materialName: m.materialName,
        quantity: 0,
        lastUpdated: new Date()
      }));
      await Inventory.create({
        siteId: site._id,
        ownerId: site.ownerId,
        items
      });
    } catch (invError) {
      console.error('Failed to create inventory for site:', invError);
    }

    // After creation, if a manager is assigned, add the site to manager's assignedSites
    if (managerId) {
      await User.findByIdAndUpdate(managerId, { $addToSet: { assignedSites: site._id } });
    }
    return res.status(201).json({ success: true, data: site });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a site
// @route   PUT /api/owner/sites/:siteId
// @access  Private/Owner
const updateSite = async (req, res) => {
  const { siteId } = req.params;

  try {
    // Prevent updating ownerId
    if (req.body.ownerId) {
      delete req.body.ownerId;
    }

    // If siteCode is being updated, check uniqueness
    if (req.body.siteCode) {
      req.body.siteCode = req.body.siteCode.toUpperCase();
      const existing = await Site.findOne({
        siteCode: req.body.siteCode,
        _id: { $ne: siteId }
      });
      if (existing) {
        return res.status(400).json({ message: 'Site with this code already exists' });
      }
    }

    if (req.body.managerId) {
      if (Array.isArray(req.body.managerId)) {
        req.body.managerId = req.body.managerId[0] || null;
      }
      if (req.body.managerId) {
        const managerUser = await User.findById(req.body.managerId);
        if (!managerUser || managerUser.role !== 'manager') {
          return res.status(400).json({ message: 'Assigned user must be a manager' });
        }
      }
    }

    const oldSite = await Site.findById(siteId);
    if (!oldSite) {
      return res.status(404).json({ message: 'Site not found' });
    }
    if (oldSite.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this site' });
    }
    const oldManagerId = oldSite.managerId;

    const site = await Site.findByIdAndUpdate(siteId, req.body, {
      new: true,
      runValidators: true
    }).populate('managerId', 'name email');

    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    if (oldManagerId?.toString() !== site.managerId?.toString()) {
      if (oldManagerId) {
        await User.findByIdAndUpdate(oldManagerId, { $pull: { assignedSites: siteId } });
      }
      if (site.managerId) {
        await User.findByIdAndUpdate(site.managerId, { $addToSet: { assignedSites: siteId } });
      }
      // Ensure no other managers have this site
      await User.updateMany(
        { role: 'manager', _id: { $ne: site.managerId } },
        { $pull: { assignedSites: siteId } }
      );
    }

    res.json({ success: true, data: site });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all sites with pagination and filters
// @route   GET /api/owner/sites
// @access  Private/Owner
const getAllSites = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  try {
    const filter = { ownerId: req.user._id };
    if (status) filter.status = status;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sites = await Site.find(filter)
      .populate('managerId', 'name email')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    if (req.user && req.user.bookmarkedSiteId) {
      const bId = req.user.bookmarkedSiteId.toString();
      const index = sites.findIndex(s => s._id.toString() === bId);
      if (index > 0) {
        const bSite = sites.splice(index, 1)[0];
        sites.unshift(bSite);
      }
    }

    const total = await Site.countDocuments(filter);

    res.json({
      success: true,
      data: sites,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get site by ID
// @route   GET /api/owner/sites/:siteId
// @access  Private/Owner
const getSiteById = async (req, res) => {
  const { siteId } = req.params;

  try {
    const site = await Site.findOne({ _id: siteId, ownerId: req.user._id }).populate('managerId', 'name email');
    if (!site) {
      return res.status(404).json({ message: 'Site not found or not authorized' });
    }

    res.json({ success: true, data: site });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Soft delete a site (set status to inactive)
// @route   DELETE /api/owner/sites/:siteId
// @access  Private/Owner
const deleteSite = async (req, res) => {
  const { siteId } = req.params;

  try {
    const site = await Site.findOne({ _id: siteId, ownerId: req.user._id });
    if (!site) {
      return res.status(404).json({ message: 'Site not found or not authorized' });
    }

    site.status = 'inactive';
    await site.save();

    if (site.managerId) {
      await User.findByIdAndUpdate(site.managerId, { $pull: { assignedSites: siteId } });
    }

    res.json({ success: true, message: 'Site deactivated successfully', data: site });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sites assigned to the logged-in manager/staff
// @route   GET /api/sites/assigned
// @access  Private (manager/staff)
const getAssignedSites = async (req, res) => {
  try {
    const user = req.user;

    if (user.role === 'owner') {
      // Owner can see all active sites they own
      const sites = await Site.find({ status: 'active', ownerId: user._id }).populate('managerId', 'name email');
      return res.json({ success: true, data: sites });
    }

    // For managers/staff, return only their assigned sites under their ownerId
    const sites = await Site.find({
      _id: { $in: user.assignedSites },
      ownerId: user.parentUserId,
      status: 'active'
    }).populate('managerId', 'name email');

    res.json({ success: true, data: sites });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign manager to a site (Owner only)
// @route   PUT /api/owner/sites/:siteId/manager
// @access  Private/Owner
const assignManagerToSite = async (req, res) => {
  const { siteId } = req.params;
  const { managerId } = req.body;

  try {
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    if (req.user.role === 'owner' && site.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to assign manager to this site' });
    }

    // Role based logic
    if (req.user.role === 'owner') {
      const oldManagerId = site.managerId;
      site.managerId = managerId || null;
      if (oldManagerId && oldManagerId.toString() !== (managerId || '').toString()) {
        await User.findByIdAndUpdate(oldManagerId, { $pull: { assignedSites: siteId } });
      }
      if (managerId) {
        await User.findByIdAndUpdate(managerId, { $addToSet: { assignedSites: siteId } });
      }
      await User.updateMany(
        { role: 'manager', _id: { $ne: managerId } },
        { $pull: { assignedSites: siteId } }
      );
    } else if (req.user.role === 'manager') {
      return res.status(403).json({ message: 'Managers cannot change the site manager' });
    } else {
      return res.status(403).json({ message: 'Not authorized to assign manager to site' });
    }

    await site.save();

    const updatedSite = await Site.findById(siteId).populate('managerId', 'name email');
    res.json({ success: true, data: updatedSite });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = {
  createSite,
  updateSite,
  getAllSites,
  getSiteById,
  deleteSite,
  getAssignedSites,
  assignManagerToSite
};
