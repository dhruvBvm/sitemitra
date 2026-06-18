const User = require('../user/user.model');
const Site = require('../site/site.model');
const Order = require('../request/request.model');

// @desc    Create a new Staff for this Manager's team
// @route   POST /api/manager/staff
// @access  Private/Manager
const createStaffForTeam = async (req, res) => {
  let { name, email, mobile, password, assignedSites, siteId } = req.body;
  if (!siteId && req.query.siteId) {
    siteId = req.query.siteId;
  }
  try {
    // Basic validation
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const finalAssignedSites = Array.isArray(assignedSites) ? [...assignedSites] : (assignedSites ? [assignedSites] : []);
    if (siteId && !finalAssignedSites.includes(siteId)) {
      finalAssignedSites.push(siteId);
    }

    if (finalAssignedSites.length === 0) {
      return res.status(400).json({ message: "At least one site must be assigned" });
    }

    const manager = req.user; // from protect middleware

    // Verify sites exist in DB and belong to this manager
    const sites = await Site.find({ _id: { $in: finalAssignedSites }, ownerId: manager.parentUserId });
    if (sites.length !== finalAssignedSites.length) {
      return res.status(400).json({ message: "One or more site IDs invalid" });
    }
    
    // Rule: manager can only assign staff to sites where they are the managerId
    const allSitesManagedByMe = sites.every(site => 
      site.managerId && site.managerId.toString() === manager._id.toString()
    );
    
    if (!allSitesManagedByMe) {
      return res.status(403).json({ message: "You can only assign staff to sites you manage" });
    }

    const exists = await User.findOne({ $or: [{ email }, { mobile }] });
    if (exists) return res.status(400).json({ message: 'User with this email or mobile already exists' });
    
    let staff = await User.create({
      name,
      email,
      mobile,
      password,
      role: 'staff',
      parentUserId: manager._id,
      ownerId: manager.parentUserId,
      assignedSites: finalAssignedSites
    });
    
    staff = await staff.populate('assignedSites', 'siteName siteCode address');
    const obj = staff.toObject();
    delete obj.password;
    res.status(201).json({ success: true, data: obj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all staff in manager's team
// @route   GET /api/manager/team
// @access  Private/Manager
const getMyTeam = async (req, res) => {
  try {
    const managerSites = await Site.find({
      managerId: req.user._id,
      ownerId: req.user.parentUserId
    }).select('_id');
    const mySiteIds = managerSites.map(s => s._id);

    const staff = await User.find({ 
      role: 'staff',
      ownerId: req.user.parentUserId,
      assignedSites: { $in: mySiteIds }
    })
      .select('-password')
      .populate({
        path: 'assignedSites',
        select: 'siteName siteCode managerId',
        populate: {
          path: 'managerId',
          select: 'name'
        }
      });
      
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update staff status in team
// @route   PUT /api/manager/staff/:staffId/status
// @access  Private/Manager
const updateStaffStatus = async (req, res) => {
  const { staffId } = req.params;
  const { status } = req.body;
  
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const staff = await User.findOne({ _id: staffId, role: 'staff', ownerId: req.user.parentUserId });
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found or not authorized' });
    }

    staff.status = status;
    await staff.save();
    
    res.json({ success: true, data: { _id: staff._id, name: staff.name, status: staff.status } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get assigned sites for manager
// @route   GET /api/manager/sites
// @access  Private/Manager
const getManagerSites = async (req, res) => {
  try {
    const sites = await Site.find({
      managerId: req.user._id,
      ownerId: req.user.parentUserId,
      status: 'active'
    }).select('siteName siteCode address status managerId').populate('managerId', 'name email');

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

// @desc    Get team performance reports for manager
// @route   GET /api/manager/reports/team
// @access  Private/Manager
const getTeamReports = async (req, res) => {
  try {
    const teamMembers = await User.find({ parentUserId: req.user._id }).select('name');
    
    const report = await Promise.all(
      teamMembers.map(async (member) => {
        const orderCount = await Order.countDocuments({ createdBy: member._id });
        return { name: member.name, orders: orderCount };
      })
    );
    
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all staff under same owner (Manager only)
// @route   GET /api/manager/staff/all
// @access  Private/Manager
const getAllOwnerStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff', ownerId: req.user.parentUserId })
      .select('-password')
      .populate('assignedSites', 'siteName siteCode');
      
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get team member by id (Manager only)
// @route   GET /api/manager/team/:staffId
// @access  Private/Manager
const getTeamMemberById = async (req, res) => {
  try {
    const staff = await User.findOne({ _id: req.params.staffId, role: 'staff', ownerId: req.user.parentUserId })
      .select('-password')
      .populate('assignedSites', 'siteName siteCode managerId');
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found or not authorized' });
    }

    const staffSites = await Site.find({ _id: { $in: staff.assignedSites }, ownerId: req.user.parentUserId });
    const hasManagedSite = staffSites.some(site => 
      site.managerId && site.managerId.toString() === req.user._id.toString()
    );
    if (!hasManagedSite) {
      return res.status(403).json({ message: 'You can only edit staff assigned to your sites' });
    }

    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update staff details (Manager only for their own team)
// @route   PUT /api/manager/team/:staffId
// @access  Private/Manager
const updateTeamMember = async (req, res) => {
  const { staffId } = req.params;
  const updateData = req.body;

  try {
    const staff = await User.findOne({ _id: staffId, role: 'staff', ownerId: req.user.parentUserId });
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found or not authorized' });
    }

    const staffSites = await Site.find({ _id: { $in: staff.assignedSites }, ownerId: req.user.parentUserId });
    const hasManagedSite = staffSites.some(site => 
      site.managerId && site.managerId.toString() === req.user._id.toString()
    );
    if (!hasManagedSite) {
      return res.status(403).json({ message: 'You can only edit staff assigned to your sites' });
    }

    // Prevent role change
    if (updateData.role) delete updateData.role;

    // Validate assignedSites if provided
    if (updateData.assignedSites !== undefined) {
      if (!Array.isArray(updateData.assignedSites)) {
        return res.status(400).json({ message: "assignedSites must be an array" });
      }
      
      if (updateData.assignedSites.length > 0) {
        const sites = await Site.find({ _id: { $in: updateData.assignedSites }, ownerId: req.user.parentUserId });
        if (sites.length !== updateData.assignedSites.length) {
          return res.status(400).json({ message: "One or more site IDs invalid" });
        }
        const allSitesManagedByMe = sites.every(site => 
          site.managerId && site.managerId.toString() === req.user._id.toString()
        );
        if (!allSitesManagedByMe) {
          return res.status(403).json({ message: 'You can only assign staff to sites you manage' });
        }
      }

      // Keep sites assigned by OTHER managers
      const currentAssignedSites = await Site.find({ _id: { $in: staff.assignedSites }, ownerId: req.user.parentUserId });
      const sitesManagedByOthers = currentAssignedSites.filter(site => 
        !site.managerId || site.managerId.toString() !== req.user._id.toString()
      ).map(site => site._id.toString());

      updateData.assignedSites = [...new Set([...sitesManagedByOthers, ...updateData.assignedSites])];
    }

    // Check email/mobile uniqueness if changed
    if (updateData.email || updateData.mobile) {
      const query = [];
      if (updateData.email && updateData.email !== staff.email) query.push({ email: updateData.email });
      if (updateData.mobile && updateData.mobile !== staff.mobile) query.push({ mobile: updateData.mobile });
      
      if (query.length > 0) {
        const exists = await User.findOne({ $or: query });
        if (exists) {
          return res.status(400).json({ message: 'Email or mobile already in use by another user' });
        }
      }
    }

    Object.assign(staff, updateData);
    await staff.save(); // This will trigger pre-save hook for password hashing if modified

    const obj = staff.toObject();
    delete obj.password;
    res.json({ success: true, data: obj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete (soft delete) staff from team
// @route   DELETE /api/manager/team/:staffId
// @access  Private/Manager
const deleteTeamMember = async (req, res) => {
  const { staffId } = req.params;

  try {
    const staff = await User.findOne({ _id: staffId, role: 'staff', ownerId: req.user.parentUserId });
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found or not authorized' });
    }

    const staffSites = await Site.find({ _id: { $in: staff.assignedSites }, ownerId: req.user.parentUserId });
    const hasManagedSite = staffSites.some(site => 
      site.managerId && site.managerId.toString() === req.user._id.toString()
    );
    if (!hasManagedSite) {
      return res.status(403).json({ message: 'You can only edit staff assigned to your sites' });
    }

    staff.status = 'inactive';
    await staff.save();

    res.json({ success: true, message: 'Staff deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign sites to a staff member in manager's team
// @route   PUT /api/manager/team/:staffId/sites
// @access  Private/Manager
const assignSitesToTeamStaff = async (req, res) => {
  const { staffId } = req.params;
  const { siteIds } = req.body;

  // Validate payload
  if (!Array.isArray(siteIds)) {
    return res.status(400).json({ message: 'siteIds must be an array' });
  }

  // Validate each siteId is a valid MongoDB ObjectId
  const mongoose = require('mongoose');
  const allValidIds = siteIds.every(id => mongoose.Types.ObjectId.isValid(id));
  if (!allValidIds) {
    return res.status(400).json({ message: 'One or more siteIds are not valid MongoDB IDs' });
  }

  try {
    // Verify staff exists and belongs to the manager's owner
    const staff = await User.findOne({ _id: staffId, role: 'staff', ownerId: req.user.parentUserId });
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found or not authorized' });
    }

    // Verify every requested site is managed by the manager
    if (siteIds.length > 0) {
      const sites = await Site.find({ _id: { $in: siteIds }, ownerId: req.user.parentUserId });
      if (sites.length !== siteIds.length) {
        return res.status(400).json({ message: 'One or more site IDs invalid' });
      }
      const allSitesManagedByMe = sites.every(site => 
        site.managerId && site.managerId.toString() === req.user._id.toString()
      );
      if (!allSitesManagedByMe) {
        return res.status(403).json({ message: 'You can only assign staff to sites you manage' });
      }
    }

    // Keep sites assigned by OTHER managers
    const currentAssignedSites = await Site.find({ _id: { $in: staff.assignedSites }, ownerId: req.user.parentUserId });
    const sitesManagedByOthers = currentAssignedSites.filter(site => 
      !site.managerId || site.managerId.toString() !== req.user._id.toString()
    ).map(site => site._id.toString());

    // Update staff's assignedSites
    staff.assignedSites = [...new Set([...sitesManagedByOthers, ...siteIds])];
    await staff.save();

    // Return populated result without password
    const updated = await User.findById(staff._id)
      .select('-password')
      .populate('assignedSites', 'siteName siteCode address');

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createStaffForTeam,
  getMyTeam,
  updateStaffStatus,
  getManagerSites,
  getTeamReports,
  updateTeamMember,
  deleteTeamMember,
  assignSitesToTeamStaff,
  getAllOwnerStaff,
  getTeamMemberById
};
