const User = require('../user/user.model');
const Site = require('../site/site.model');
const Request = require('../request/request.model');

// @desc    Create a new Manager (Owner only)
// @route   POST /api/owner/manager
// @access  Private/Owner
const createManager = async (req, res) => {
  let { name, email, mobile, password } = req.body;
  try {
    const exists = await User.findOne({ $or: [{ email }, { mobile }] });
    if (exists) return res.status(400).json({ message: 'User with this email or mobile already exists' });
    let manager = await User.create({ name, email, mobile, password, role: 'manager', parentUserId: req.user._id, ownerId: req.user._id, assignedSites: [] });
    manager = await manager.populate('assignedSites', 'siteName siteCode');
    const obj = manager.toObject(); delete obj.password;
    res.status(201).json(obj);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc    Create a new Staff (Owner only)
// @route   POST /api/owner/staff
// @access  Private/Owner
const createStaff = async (req, res) => {
  let { name, email, mobile, password, assignedSites, siteId } = req.body;
  if (!siteId && req.query.siteId) {
    siteId = req.query.siteId;
  }
  try {
    const finalAssignedSites = Array.isArray(assignedSites) ? [...assignedSites] : (assignedSites ? [assignedSites] : []);
    if (siteId && !finalAssignedSites.includes(siteId)) {
      finalAssignedSites.push(siteId);
    }

    if (finalAssignedSites.length === 0) {
      return res.status(400).json({ message: "At least one site must be assigned" });
    }

    // Verify sites exist in DB
    const sites = await Site.find({ _id: { $in: finalAssignedSites }, ownerId: req.user._id });
    if (sites.length !== finalAssignedSites.length) {
      return res.status(400).json({ message: "One or more site IDs invalid" });
    }

    const exists = await User.findOne({ $or: [{ email }, { mobile }] });
    if (exists) return res.status(400).json({ message: 'User with this email or mobile already exists' });

    // Set parentUserId to owner's id
    let staff = await User.create({ name, email, mobile, password, role: 'staff', parentUserId: req.user._id, ownerId: req.user._id, assignedSites: finalAssignedSites });
    staff = await staff.populate('assignedSites', 'siteName siteCode address');
    const obj = staff.toObject(); delete obj.password;
    res.status(201).json(obj);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc    Assign sites to a user (Owner only)
// @route   PUT /api/owner/:userId/sites
// @access  Private/Owner
const assignSitesToUser = async (req, res) => {
  const userId = req.params.userId || req.body.userId;
  const { siteIds } = req.body;
  try {
    const user = await User.findOne({ _id: userId, ownerId: req.user._id });
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.assignedSites = siteIds;
    await user.save();
    const updated = await User.findById(userId).select('-password').populate('parentUserId', 'name email');
    res.json(updated);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc    Get all users (Owner only)
// @route   GET /api/owner
// @access  Private/Owner
const getAllUsers = async (req, res) => {
  const { role, parentUserId, status, page = 1, limit = 10 } = req.query;
  try {
    const query = { ownerId: req.user._id };
    if (role) query.role = role;
    if (parentUserId) query.parentUserId = parentUserId;
    if (status) query.status = status;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const users = await User.find(query).select('-password').populate('parentUserId', 'name email').populate('assignedSites', 'siteName siteCode').skip(skip).limit(limitNum);
    const total = await User.countDocuments(query);
    res.json({ users, page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc    Get user by ID (Owner only)
// @route   GET /api/owner/:userId
// @access  Private/Owner
const getUserById = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findOne({ _id: userId, ownerId: req.user._id }).select('-password').populate('parentUserId', 'name email').populate('assignedSites', 'siteName siteCode');
    if (!user) return res.status(404).json({ message: 'User not found or not authorized' });
    res.json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc    Update user status (Owner only)
// @route   PUT /api/owner/:userId/status
// @access  Private/Owner
const updateUserStatus = async (req, res) => {
  const userId = req.params.userId || req.body.userId;
  const { status } = req.body;
  try {
    const user = await User.findOne({ _id: userId, ownerId: req.user._id });
    if (!user) return res.status(404).json({ message: 'User not found or not authorized' });
    user.status = status;
    await user.save();
    res.json({ _id: user._id, name: user.name, status: user.status });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc    Assign staff to a manager (Owner only)
// @route   PUT /api/owner/staff/:staffId/manager
// @access  Private/Owner
const assignStaffToManager = async (req, res) => {
  const { staffId } = req.params;
  const { managerId } = req.body;
  try {
    const staff = await User.findOne({ _id: staffId, ownerId: req.user._id });
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: 'Staff member not found or not authorized' });
    }
    const manager = await User.findOne({ _id: managerId, ownerId: req.user._id });
    if (!manager || manager.role !== 'manager') {
      return res.status(400).json({ message: 'Invalid manager ID or not authorized' });
    }
    staff.parentUserId = managerId;
    await staff.save();
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update manager details (Owner only)
// @route   PUT /api/owner/manager/:managerId
// @access  Private/Owner
const updateManager = async (req, res) => {
  const { managerId } = req.params;
  const updateData = req.body;
  try {
    const manager = await User.findOne({ _id: managerId, ownerId: req.user._id });
    if (!manager) return res.status(404).json({ message: 'Manager not found or not authorized' });
    if (manager.role !== 'manager') return res.status(400).json({ message: 'User is not a manager' });
    // Prevent role change
    if (updateData.role && updateData.role !== 'manager') {
      return res.status(400).json({ message: 'Cannot change role of a manager' });
    }
    if (updateData.name) manager.name = updateData.name;
    if (updateData.email) manager.email = updateData.email;
    if (updateData.mobile) manager.mobile = updateData.mobile;
    if (updateData.status) manager.status = updateData.status;
    if (updateData.password) manager.password = updateData.password;
    if (updateData.assignedSites !== undefined) {
      if (!Array.isArray(updateData.assignedSites)) {
        manager.assignedSites = updateData.assignedSites ? [updateData.assignedSites] : [];
      } else {
        manager.assignedSites = updateData.assignedSites;
      }
    }
    await manager.save();
    const obj = manager.toObject(); delete obj.password;
    res.json(obj);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc    Update user details (Owner only)
// @route   PUT /api/owner/user/:userId
// @access  Private/Owner
const updateUser = async (req, res) => {
  const { userId } = req.params;
  const updateData = req.body;
  try {
    const user = await User.findOne({ _id: userId, ownerId: req.user._id });
    if (!user) return res.status(404).json({ message: 'User not found or not authorized' });
    
    // Prevent role change
    if (updateData.role && updateData.role !== user.role) {
      return res.status(400).json({ message: 'Cannot change role of user' });
    }

    // Check for duplicate email or mobile
    if (updateData.email || updateData.mobile) {
      const orConditions = [];
      if (updateData.email) orConditions.push({ email: updateData.email });
      if (updateData.mobile) orConditions.push({ mobile: updateData.mobile });
      
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        $or: orConditions
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email or mobile already exists' });
      }
    }

    if (updateData.name) user.name = updateData.name;
    if (updateData.email) user.email = updateData.email;
    if (updateData.mobile) user.mobile = updateData.mobile;
    if (updateData.status) user.status = updateData.status;
    if (updateData.password) user.password = updateData.password;

    if (updateData.assignedSites !== undefined) {
      if (!Array.isArray(updateData.assignedSites)) {
        user.assignedSites = updateData.assignedSites ? [updateData.assignedSites] : [];
      } else {
        user.assignedSites = updateData.assignedSites;
      }
    }

    await user.save();
    const obj = user.toObject(); delete obj.password;
    res.json(obj);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc    Soft delete user (set status inactive) (Owner only)
// @route   DELETE /api/owner/user/:userId
// @access  Private/Owner
const deleteUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findOne({ _id: userId, ownerId: req.user._id });
    if (!user) return res.status(404).json({ message: 'User not found or not authorized' });
    user.status = 'inactive';
    await user.save();
    res.json({ success: true, message: 'User deactivated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc    Delete manager (soft)
// @route   DELETE /api/owner/manager/:managerId
// @access  Private/Owner
const deleteManager = async (req, res) => {
  const { managerId } = req.params;
  try {
    const manager = await User.findOne({ _id: managerId, ownerId: req.user._id });
    if (!manager) return res.status(404).json({ message: 'Manager not found or not authorized' });
    if (manager.role !== 'manager') return res.status(400).json({ message: 'User is not a manager' });
    manager.status = 'inactive';
    await manager.save();
    res.json({ success: true, message: 'Manager deactivated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc    Get dashboard statistics (Owner only)
// @route   GET /api/owner/reports/dashboard
// @access  Private/Owner
const getDashboardStats = async (req, res) => {
  try {
    const totalManagers = await User.countDocuments({ role: 'manager', ownerId: req.user._id });
    const totalStaff = await User.countDocuments({ role: 'staff', ownerId: req.user._id });
    const totalSites = await Site.countDocuments({ status: 'active', ownerId: req.user._id });
    const totalOrders = await Request.countDocuments({ ownerId: req.user._id });
    const pendingApprovals = await Request.countDocuments({ status: 'pending_manager', ownerId: req.user._id });
    const completedOrders = await Request.countDocuments({ status: 'completed', ownerId: req.user._id });
    const stats = { totalManagers, totalStaff, totalSites, totalOrders, pendingApprovals, completedOrders };
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

  // @desc    Get monthly orders data for a given year
  // @route   GET /api/owner/reports/monthly?year=2026
  // @access  Private/Owner
  const getMonthlyOrders = async (req, res) => {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();
      // Aggregate orders by month
      const monthly = await Request.aggregate([
        { $match: { ownerId: req.user._id, createdAt: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) } } },
        { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
        { $project: { _id: 0, month: "$_id", count: 1 } },
        { $sort: { month: 1 } }
      ]);
      res.json({ success: true, data: monthly });
    } catch (error) {
      console.error('Monthly orders error:', error);
      res.status(500).json({ message: error.message });
    }
  };

  // @desc    Get order status breakdown
  // @route   GET /api/owner/reports/status-breakdown
  // @access  Private/Owner
  const getStatusBreakdown = async (req, res) => {
    try {
      const breakdown = await Request.aggregate([
        { $match: { ownerId: req.user._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } }
      ]);
      res.json({ success: true, data: breakdown });
    } catch (error) {
      console.error('Status breakdown error:', error);
      res.status(500).json({ message: error.message });
    }
  };

module.exports = {
  createManager,
  createStaff,
  assignSitesToUser,
  getAllUsers,
  getUserById,
  updateUserStatus,
  assignStaffToManager,
  updateManager,
  deleteManager,
  updateUser,
  deleteUser,
  getDashboardStats,
  getMonthlyOrders,
  getStatusBreakdown,
};
