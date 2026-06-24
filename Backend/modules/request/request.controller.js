const Request = require('../request/request.model');
const User = require('../user/user.model');
const Site = require('../site/site.model');
const { createNotification } = require('../../utils/notify');

const { uploadToCloudinary } = require('../../services/cloudinary');
// -----------------------------------------------------------------------------
// STAFF ENDPOINTS
// -----------------------------------------------------------------------------

// Generate request number helper
const generateRequestNo = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Request.countDocuments({ requestNo: new RegExp(`^REQ-${dateStr}`) });
  const sequence = String(count + 1).padStart(4, '0');
  return `REQ-${dateStr}-${sequence}`;
};

// @desc    Create manual request (Staff)
// @route   POST /api/staff/requests/manual
// @route   POST /api/staff/requests/manual
// @access  Private/Staff
const createManualRequest = async (req, res) => {
  const { siteId, materials, notes, priority, userNotes, requestDate } = req.body;
  if (!siteId) {
    return res.status(400).json({ message: 'Site is required' });
  }
  if (!materials || materials.length === 0) {
    return res.status(400).json({ message: 'Materials are required' });
  }

  try {
    // Validate site is assigned to user (owner bypasses)
    const user = req.user;
    if (user.role !== 'owner' && !user.assignedSites.includes(siteId)) {
      return res.status(403).json({ message: 'Site not assigned to you' });
    }

    const ownerId = user.role === 'owner' ? user._id : (user.ownerId || user.parentUserId);

    // Transform materials array mapping name -> materialName and qty -> quantity
    const transformedMaterials = materials.map(m => {
      const urls = m.imageUrls || [];
      if (urls.length > 5) {
        throw new Error('Maximum of 5 images allowed per material');
      }
      return {
        materialName: m.materialName || m.name,
        quantity: Number(m.quantity || m.qty),
        unit: m.unit,
        requiredDate: m.requiredDate,
        remarks: m.remarks || '',
        imageUrls: urls
      };
    });
    const requestNo = req.body.requestNo || await generateRequestNo();
    let initialStatus = 'pending_manager';
    let approvalHistory = [];
    if (user.role === 'owner') {
      initialStatus = 'approved';
      approvalHistory.push({ action: 'created_by_owner', by: user._id, comment: 'Request created by owner directly', timestamp: new Date() });
    } else if (user.role === 'manager') {
      initialStatus = 'pending_owner';
    }

    const request = new Request({
      requestNo,
      siteId,
      createdBy: user._id,
      ownerId,
      requestType: 'manual',
      materials: transformedMaterials,
      userNotes: userNotes || notes || '',
      priority: priority || 'medium',
      status: initialStatus,
      approvalHistory,
      ...(requestDate && { createdAt: new Date(requestDate) })
    });

    await request.save();
    // Notifications
    if (user.role === 'staff' && user.parentUserId) {
      await createNotification(user.parentUserId, 'New Request Submitted', `Request ${requestNo} needs your approval.`);
    } else if (user.role === 'manager') {
      const owner = await User.findOne({ role: 'owner', _id: ownerId });
      if (owner) {
        await createNotification(owner._id, 'New Request Submitted', `Request ${requestNo} created by manager and needs your approval.`);
      }
    }

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    console.error("Request creation error:", error);
    res.status(500).json({ message: error.message });
  }
};

const createPhotoRequest = async (req, res) => {
  const { siteId, notes, userNotes, priority, materials, requestDate } = req.body;
  if (!siteId) {
    return res.status(400).json({ message: 'Site is required' });
  }
  if ((!req.files || req.files.length === 0) && (!materials || materials.length === 0)) {
    return res.status(400).json({ message: 'At least one image or material is required' });
  }

  // Parse materials if provided (may be JSON string)
  let parsedMaterials = [];
  if (materials) {
    if (typeof materials === 'string') {
      try {
        parsedMaterials = JSON.parse(materials);
      } catch (e) {
        console.error('Materials JSON parse error:', e);
        return res.status(400).json({ message: 'Invalid materials format' });
      }
    } else if (Array.isArray(materials)) {
      parsedMaterials = materials;
    }
  }
  // Transform materials array mapping name -> materialName and qty -> quantity
  const transformedMaterials = parsedMaterials.map(m => ({
    materialName: m.materialName || m.name,
    quantity: Number(m.quantity || m.qty),
    unit: m.unit,
    requiredDate: m.requiredDate,
    remarks: m.remarks || '',
    imageUrls: m.imageUrls || []
  }));
  // Validate materials if provided
  if (transformedMaterials.length > 0) {
    const isValid = transformedMaterials.every(item => {
      const nameVal = item.materialName;
      const qtyVal = item.quantity;
      const unitVal = item.unit;
      return nameVal && nameVal !== '' && !isNaN(qtyVal) && qtyVal !== 0 && unitVal && unitVal !== '';
    });
    if (!isValid) {
      return res.status(400).json({ message: 'Incomplete material details. Please fill materialName, quantity, and unit for all materials.' });
    }
  }

  try {
    const user = req.user;
    // Validate sites assignment
    if (user.role !== 'owner' && !user.assignedSites.includes(siteId)) {
      return res.status(403).json({ message: 'Site not assigned to you' });
    }

    const ownerId = user.role === 'owner' ? user._id : (user.ownerId || user.parentUserId);

    const requestNo = req.body.requestNo || await generateRequestNo();
    // Ensure at most 5 order images
    let orderFiles = (req.files || []).filter(f => f.fieldname === 'orderImages');
    if (orderFiles.length === 0 && req.files && req.files.length > 0) {
      orderFiles = req.files;
    }
    if (orderFiles.length === 0 && transformedMaterials.length === 0) {
      console.warn('No order images or materials provided');
      return res.status(400).json({ message: 'At least one order image or material is required' });
    }
    if (orderFiles.length > 5) {
      console.warn('Too many order images:', orderFiles.length);
      return res.status(400).json({ message: 'Maximum of 5 order images allowed' });
    }
    // Upload order images
    const imageUrls = [];
    for (const file of orderFiles) {
      if (!file.buffer) {
        console.error('Missing file buffer for upload');
        return res.status(400).json({ message: 'File buffer missing for upload' });
      }
      try {
        const secureUrl = await uploadToCloudinary(file.buffer);
        imageUrls.push(secureUrl);
      } catch (err) {
        console.error('Cloudinary upload error for order image:', err);
        return res.status(500).json({ message: 'Failed to upload order image' });
      }
    }
    // Process material-specific images (validate max 5)
    for (const mat of transformedMaterials) {
      if (mat.imageUrls && mat.imageUrls.length > 5) {
        return res.status(400).json({ message: 'Maximum of 5 images allowed per material' });
      }
    }

    let initialStatus = 'pending_manager';
    let approvalHistory = [];
    if (user.role === 'owner') {
      initialStatus = 'approved';
      approvalHistory.push({ action: 'created_by_owner', by: user._id, comment: 'Photo request created by owner directly', timestamp: new Date() });
    } else if (user.role === 'manager') {
      initialStatus = 'pending_owner';
    }

    const request = new Request({
      requestNo,
      siteId,
      createdBy: user._id,
      ownerId,
      requestType: 'photo',
      imageUrls,
      userNotes: userNotes || notes || '',
      priority: priority || 'medium',
      status: initialStatus,
      materials: transformedMaterials,
      approvalHistory,
      ...(requestDate && { createdAt: new Date(requestDate) })
    });

    await request.save();
    // Notifications
    if (user.role === 'staff' && user.parentUserId) {
      await createNotification(user.parentUserId, 'New Photo Request Submitted', `Photo Request ${requestNo} needs your approval.`);
    } else if (user.role === 'manager') {
      const owner = await User.findOne({ role: 'owner', _id: ownerId });
      if (owner) {
        await createNotification(owner._id, 'New Photo Request Submitted', `Photo Request ${requestNo} created by manager and needs your approval.`);
      }
    }

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    console.error('Photo request creation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get own requests (Staff)
// @route   GET /api/staff/requests
// @access  Private/Staff
const getMyRequests = async (req, res) => {
  const { status, priority, startDate, endDate, page = 1, limit = 10 } = req.query;
  const ownerId = req.user.role === 'owner' ? req.user._id : (req.user.ownerId || req.user.parentUserId);

  try {
    const filter = { createdBy: req.user._id, ownerId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const requests = await Request.find(filter)
      .populate('siteId', 'siteName siteCode')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Request.countDocuments(filter);

    res.json({
      success: true,
      data: requests,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get specific request details (Staff/Manager/Owner)
// @route   GET /api/requests/:requestId (shared logic)
// @access  Private
const getRequestById = async (req, res) => {
  const { requestId } = req.params;
  const ownerId = req.user.role === 'owner' ? req.user._id : (req.user.ownerId || req.user.parentUserId);

  try {
    const request = await Request.findOne({ _id: requestId, ownerId })
      .populate('siteId', 'siteName siteCode address managerId')
      .populate('createdBy', 'name email role')
      .populate('approvalHistory.by', 'name email role');

    if (!request) {
      return res.status(404).json({ message: 'Request not found or not authorized' });
    }

    // Role-based access check
    const user = req.user;
    if (user.role === 'staff' && request.createdBy._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    // Manager can access requests created by staff under them, their own requests, or requests for their sites
    if (user.role === 'manager') {
      const isDirectManager = request.createdBy?.parentUserId?.toString() === user._id.toString();
      const isCreator = request.createdBy?._id?.toString() === user._id.toString();
      const isSiteManager = request.siteId?.managerId?.toString() === user._id.toString();
      const isAssignedSite = Array.isArray(user.assignedSites) && user.assignedSites.some(id => id.toString() === request.siteId?._id?.toString());

      if (!isDirectManager && !isCreator && !isSiteManager && !isAssignedSite) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -----------------------------------------------------------------------------
// MANAGER ENDPOINTS
// -----------------------------------------------------------------------------

// @desc    Get team requests (Manager)
// @route   GET /api/manager/requests
// @access  Private/Manager
const getTeamRequests = async (req, res) => {
  const { status, priority, siteId, page = 1, limit = 10 } = req.query;
  const ownerId = req.user.role === 'owner' ? req.user._id : (req.user.ownerId || req.user.parentUserId);

  try {
    // Find sites managed by this manager under same owner
    const sites = await Site.find({
      ownerId,
      $or: [
        { managerId: req.user._id },
        { _id: { $in: req.user.assignedSites || [] } }
      ]
    }).select('_id');
    const allowedSiteIds = sites.map(s => s._id);

    // Find staff managed by this manager under same owner
    const teamMembers = await User.find({ parentUserId: req.user._id, ownerId }).select('_id');
    const teamIds = teamMembers.map(u => u._id);
    teamIds.push(req.user._id); // Include manager's own requests

    let filter = {
      ownerId,
      $or: [
        { siteId: { $in: allowedSiteIds } },
        { createdBy: { $in: teamIds } }
      ]
    };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    if (siteId) {
      if (!allowedSiteIds.some(id => id.toString() === siteId.toString())) {
        return res.status(403).json({ message: 'Access denied to this site' });
      }
      filter = { ...filter, siteId: siteId };
      delete filter.$or;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const requests = await Request.find(filter)
      .populate('siteId', 'siteName siteCode')
      .populate('createdBy', 'name email')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Request.countDocuments(filter);

    res.json({
      success: true,
      data: requests,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Manager approve an request
// @route   PUT /api/manager/requests/:requestId/approve
// @access  Private/Manager
const managerApproveRequest = async (req, res) => {
  const { requestId } = req.params;
  const { comment } = req.body;
  const ownerId = req.user.role === 'owner' ? req.user._id : (req.user.ownerId || req.user.parentUserId);

  try {
    const request = await Request.findOne({ _id: requestId, ownerId }).populate('createdBy').populate('siteId');
    if (!request) return res.status(404).json({ message: 'Request not found or not authorized' });

    // Validate permission
    const isDirectManager = request.createdBy?.parentUserId?.toString() === req.user._id.toString();
    const isSiteManager = request.siteId?.managerId?.toString() === req.user._id.toString();
    const isAssignedSite = Array.isArray(req.user.assignedSites) && req.user.assignedSites.some(id => id.toString() === request.siteId._id.toString());

    if (!isDirectManager && !isSiteManager && !isAssignedSite) {
      return res.status(403).json({ message: 'Not authorized to approve this request' });
    }

    if (request.status !== 'pending_manager') {
      return res.status(400).json({ message: `Cannot approve request. Status is '${request.status}'` });
    }

    request.status = 'pending_owner';
    request.approvalHistory.push({
      action: 'approved_by_manager',
      by: req.user._id,
      comment: comment || '',
      timestamp: new Date()
    });

    await request.save();

    // Notify owner
    const owner = await User.findOne({ role: 'owner', _id: ownerId });
    if (owner) {
      await createNotification(owner._id, 'Request Forwarded', `Request ${request.requestNo} approved by manager and pending your review.`);
    }

    // Notify staff
    await createNotification(request.createdBy._id, 'Request Approved', `Request ${request.requestNo} was approved by your manager and forwarded to owner.`);

    res.json({ success: true, message: 'Request approved and forwarded to owner', data: request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Manager reject an request
// @route   PUT /api/manager/requests/:requestId/reject
// @access  Private/Manager
const managerRejectRequest = async (req, res) => {
  const { requestId } = req.params;
  const { comment } = req.body;
  const ownerId = req.user.role === 'owner' ? req.user._id : (req.user.ownerId || req.user.parentUserId);

  try {
    const request = await Request.findOne({ _id: requestId, ownerId }).populate('createdBy').populate('siteId');
    if (!request) return res.status(404).json({ message: 'Request not found or not authorized' });

    const isDirectManager = request.createdBy?.parentUserId?.toString() === req.user._id.toString();
    const isSiteManager = request.siteId?.managerId?.toString() === req.user._id.toString();
    const isAssignedSite = Array.isArray(req.user.assignedSites) && req.user.assignedSites.some(id => id.toString() === request.siteId._id.toString());

    if (!isDirectManager && !isSiteManager && !isAssignedSite) {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }

    if (request.status !== 'pending_manager') {
      return res.status(400).json({ message: `Cannot reject request. Status is '${request.status}'` });
    }

    request.status = 'rejected_by_manager';
    request.approvalHistory.push({
      action: 'rejected_by_manager',
      by: req.user._id,
      comment: comment || '',
      timestamp: new Date()
    });

    await request.save();

    // Notify staff
    await createNotification(request.createdBy._id, 'Request Rejected', `Request ${request.requestNo} was rejected by your manager.`);

    res.json({ success: true, message: 'Request rejected', data: request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// -----------------------------------------------------------------------------
// OWNER ENDPOINTS
// -----------------------------------------------------------------------------

// @desc    Get all requests (owner view)
// @route   GET /api/owner/requests
// @access  Private/Owner
const getAllRequests = async (req, res) => {
  const { siteId, status, priority, createdBy, startDate, endDate, page = 1, limit = 10 } = req.query;
  const ownerId = req.user._id;

  try {
    const filter = { ownerId };
    if (siteId) filter.siteId = siteId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (createdBy) filter.createdBy = createdBy;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const requests = await Request.find(filter)
      .populate('siteId', 'siteName siteCode')
      .populate('createdBy', 'name email role')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Request.countDocuments(filter);

    res.json({
      success: true,
      data: requests,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Owner approve an request
// @route   PUT /api/owner/requests/:requestId/approve
// @access  Private/Owner
const ownerApproveRequest = async (req, res) => {
  const { requestId } = req.params;
  const { comment } = req.body;
  const ownerId = req.user._id;

  try {
    const request = await Request.findOne({ _id: requestId, ownerId }).populate('createdBy');
    if (!request) return res.status(404).json({ message: 'Request not found or not authorized' });

    if (request.status !== 'pending_owner') {
      return res.status(400).json({ message: `Cannot approve. Status is '${request.status}'. Expected 'pending_owner'.` });
    }

    request.status = 'approved';
    request.approvalHistory.push({
      action: 'approved',
      by: req.user._id,
      comment: comment || '',
      timestamp: new Date()
    });

    await request.save();

    // Notify staff and manager
    await createNotification(request.createdBy._id, 'Request Approved', `Request ${request.requestNo} was approved by Owner.`);
    if (request.createdBy.parentUserId) {
      await createNotification(request.createdBy.parentUserId, 'Request Approved', `Request ${request.requestNo} was approved by Owner.`);
    }

    res.json({ success: true, message: 'Request approved successfully', data: request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Owner reject an request
// @route   PUT /api/owner/requests/:requestId/reject
// @access  Private/Owner
const ownerRejectRequest = async (req, res) => {
  const { requestId } = req.params;
  const { comment } = req.body;
  const ownerId = req.user._id;

  try {
    const request = await Request.findOne({ _id: requestId, ownerId }).populate('createdBy');
    if (!request) return res.status(404).json({ message: 'Request not found or not authorized' });

    if (request.status !== 'pending_owner') {
      return res.status(400).json({ message: `Cannot reject. Status is '${request.status}'. Expected 'pending_owner'.` });
    }

    request.status = 'rejected_by_owner';
    request.approvalHistory.push({
      action: 'rejected_by_owner',
      by: req.user._id,
      comment: comment || '',
      timestamp: new Date()
    });

    await request.save();

    // Notify staff and manager
    await createNotification(request.createdBy._id, 'Request Rejected', `Request ${request.requestNo} was rejected by Owner.`);
    if (request.createdBy.parentUserId) {
      await createNotification(request.createdBy.parentUserId, 'Request Rejected', `Request ${request.requestNo} was rejected by Owner.`);
    }

    res.json({ success: true, message: 'Request rejected', data: request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update request status (Owner or Manager)
// @route   PUT /api/requests/:requestId/status
// @access  Private (Owner/Manager)
const updateRequestStatus = async (req, res) => {
  const { requestId } = req.params;
  const { status, comment } = req.body;
  const allowedStatuses = ['purchase_requested', 'delivered', 'closed'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status update' });
  }

  const ownerId = req.user.role === 'owner' ? req.user._id : (req.user.ownerId || req.user.parentUserId);

  try {
    const request = await Request.findOne({ _id: requestId, ownerId }).populate('createdBy').populate('siteId');
    if (!request) return res.status(404).json({ message: 'Request not found or not authorized' });

    // Validate permission for manager
    if (req.user.role === 'manager') {
      const isDirectManager = request.createdBy?.parentUserId?.toString() === req.user._id.toString();
      const isCreator = request.createdBy?._id?.toString() === req.user._id.toString();
      const isSiteManager = request.siteId?.managerId?.toString() === req.user._id.toString();
      const isAssignedSite = Array.isArray(req.user.assignedSites) && req.user.assignedSites.some(id => id.toString() === request.siteId?._id?.toString());

      if (!isDirectManager && !isCreator && !isSiteManager && !isAssignedSite) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    request.status = status;
    request.approvalHistory.push({
      action: status,
      by: req.user._id,
      comment: comment || '',
      timestamp: new Date()
    });

    await request.save();

    // Notify staff
    await createNotification(request.createdBy._id, 'Request Update', `Request ${request.requestNo} status changed to ${status}.`);
    // Also notify manager if applicable
    if (request.createdBy.parentUserId) {
      await createNotification(request.createdBy.parentUserId, 'Request Update', `Request ${request.requestNo} status changed to ${status}.`);
    }

    res.json({ success: true, message: `Request status updated to ${status}`, data: request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  createManualRequest,
  createPhotoRequest,
  getMyRequests,
  getRequestById,
  getTeamRequests,
  managerApproveRequest,
  managerRejectRequest,
  getAllRequests,
  ownerApproveRequest,
  ownerRejectRequest,
  updateRequestStatus
};
