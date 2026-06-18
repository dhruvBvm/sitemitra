const Inventory = require('./inventory.model');
const InventoryEntry = require('./inventoryEntry.model');
const Site = require('../site/site.model');
const Material = require('../material/material.model');
const { generateEntryNo } = require('./utils/entryNumber');

const checkSiteAccess = (user, siteId) => {
  if (user.role === 'owner') return true;
  if ((user.role === 'manager' || user.role === 'staff') && user.assignedSites && user.assignedSites.some(id => id.toString() === siteId.toString())) return true;
  return false;
};

exports.listSitesInventory = async (req, res) => {
  const ownerId = req.user.role === 'owner' ? req.user._id : (req.user.ownerId || req.user.parentUserId);
  try {
    let siteFilter = { status: 'active', ownerId };
    if (req.user.role !== 'owner') {
      siteFilter = {
        ownerId,
        $or: [
          { managerId: req.user._id },
          { _id: { $in: req.user.assignedSites || [] } }
        ],
        status: 'active'
      };
    }
    
    const sites = await Site.find(siteFilter)
      .select('siteName siteCode status location managerId')
      .populate('managerId', 'name');
    const inventories = await Inventory.find({ ownerId, siteId: { $in: sites.map(s => s._id) } });
    
    const result = sites.map(site => {
      const inv = inventories.find(i => i.siteId.toString() === site._id.toString());
      return {
        siteId: site._id,
        siteName: site.siteName,
        siteCode: site.siteCode,
        status: site.status,
        location: site.location,
        manager: site.managerId ? { name: site.managerId.name } : null,
        totalItems: inv ? inv.items.length : 0,
        updatedAt: inv ? inv.updatedAt : null
      };
    });
    
    if (req.user && req.user.bookmarkedSiteId) {
      const bId = req.user.bookmarkedSiteId.toString();
      const index = result.findIndex(s => s.siteId.toString() === bId);
      if (index > 0) {
        const bSite = result.splice(index, 1)[0];
        result.unshift(bSite);
      }
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSiteInventory = async (req, res) => {
  const ownerId = req.user.role === 'owner' ? req.user._id : (req.user.ownerId || req.user.parentUserId);
  try {
    const { siteId } = req.params;
    const site = await Site.findOne({
      _id: siteId,
      ownerId,
      ...(req.user.role !== 'owner' ? {
        $or: [
          { managerId: req.user._id },
          { _id: { $in: req.user.assignedSites || [] } }
        ]
      } : {})
    });
    if (!site) {
      return res.status(403).json({ message: 'Access denied to this site' });
    }
    
    const activeMaterials = await Material.find({ status: 'active', ownerId });
    let inventory = await Inventory.findOne({ siteId, ownerId }).populate('siteId', 'siteName siteCode');
    
    if (!inventory) {
      const items = activeMaterials.map(m => ({
        materialId: m._id,
        materialName: m.materialName,
        quantity: 0,
        lastUpdated: new Date()
      }));
      inventory = new Inventory({
        siteId,
        ownerId,
        items,
        updatedAt: new Date()
      });
      await inventory.save();
      inventory = await Inventory.findOne({ siteId, ownerId }).populate('siteId', 'siteName siteCode');
    } else {
      let updated = false;
      for (const m of activeMaterials) {
        const hasItem = inventory.items.some(item => item.materialId && item.materialId.toString() === m._id.toString());
        if (!hasItem) {
          inventory.items.push({
            materialId: m._id,
            materialName: m.materialName,
            quantity: 0,
            lastUpdated: new Date()
          });
          updated = true;
        }
      }
      if (updated) {
        await inventory.save();
      }
    }
    
    await inventory.populate('items.materialId');
    
    const mappedItems = inventory.items.map(item => {
      const material = item.materialId;
      return {
        materialId: material ? material._id : item.materialId,
        materialName: material ? material.materialName : item.materialName,
        quantity: item.quantity,
        unit: material ? material.unit : '',
        lastUpdated: item.lastUpdated
      };
    });
    
    res.json({
      success: true,
      data: {
        _id: inventory._id,
        siteId: inventory.siteId,
        items: mappedItems,
        updatedAt: inventory.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMaterialHistory = async (req, res) => {
  const ownerId = req.user.role === 'owner' ? req.user._id : (req.user.ownerId || req.user.parentUserId);
  try {
    const { siteId, materialId } = req.params;
    const site = await Site.findOne({
      _id: siteId,
      ownerId,
      ...(req.user.role !== 'owner' ? {
        $or: [
          { managerId: req.user._id },
          { _id: { $in: req.user.assignedSites || [] } }
        ]
      } : {})
    });
    if (!site) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const inventory = await Inventory.findOne({ siteId, ownerId });
    const stockItem = inventory?.items.find(i => i.materialId && i.materialId.toString() === materialId);
    const currentStock = stockItem ? stockItem.quantity : 0;
    
    const materialObj = await Material.findOne({ _id: materialId, ownerId });
    
    const entries = await InventoryEntry.find({ siteId, ownerId, 'materials.materialId': materialId })
      .populate('createdBy', 'name email')
      .sort({ date: -1 });
      
    let totalStockIn = 0;
    let totalStockOut = 0;

    const combinedHistory = entries.map(e => {
      const mat = e.materials.find(m => m.materialId && m.materialId.toString() === materialId);
      if (e.type === 'received') {
        totalStockIn += mat.quantity;
      } else {
        totalStockOut += mat.quantity;
      }
      return {
        entryId: e._id,
        entryNo: e.entryNo,
        date: e.date,
        quantity: mat.quantity,
        unit: mat.unit,
        notes: e.notes,
        party: e.supplierName,
        images: mat.imageUrls || [],
        createdBy: e.createdBy?.name,
        type: e.type === 'received' ? 'Received' : 'Used'
      };
    });
    
    combinedHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let balance = 0;
    const historyWithBalance = combinedHistory.map(item => {
      if (item.type === 'Received') {
        balance += item.quantity;
      } else {
        balance -= item.quantity;
      }
      return { ...item, runningBalance: balance };
    });
    
    historyWithBalance.reverse();
    
    res.json({
      success: true,
      data: {
        materialName: stockItem?.materialName || materialObj?.materialName || 'Unknown Material',
        costCode: materialObj?.category || 'Other',
        unit: stockItem?.unit || materialObj?.unit || '',
        currentStock,
        totalStockIn,
        totalStockOut,
        estimatedQuantity: 0,
        history: historyWithBalance
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createReceivedEntry = async (req, res) => {
  const ownerId = req.user.role === 'owner' ? req.user._id : (req.user.ownerId || req.user.parentUserId);
  try {
    const { siteId, receivedDate, materials, notes, imageUrls, supplierName, challanNo, vehicleNo } = req.body;
    
    const site = await Site.findOne({
      _id: siteId,
      ownerId,
      ...(req.user.role !== 'owner' ? {
        $or: [
          { managerId: req.user._id },
          { _id: { $in: req.user.assignedSites || [] } }
        ]
      } : {})
    });
    if (!site) {
      return res.status(403).json({ message: 'Access denied to this site' });
    }
    
    if (!materials || materials.length === 0) {
      return res.status(400).json({ message: 'Materials required' });
    }
    
    if (imageUrls && imageUrls.length > 5) {
      return res.status(400).json({ message: 'Max 5 images allowed per entry' });
    }
    
    for (let mat of materials) {
      if (mat.quantity <= 0) {
        return res.status(400).json({ message: `Invalid quantity for ${mat.materialName}` });
      }
      if (mat.imageUrls && mat.imageUrls.length > 5) {
        return res.status(400).json({ message: `Max 5 images per material (${mat.materialName})` });
      }
      
      const updateResult = await Inventory.findOneAndUpdate(
        { siteId, ownerId, "items.materialId": mat.materialId },
        { 
          $inc: { "items.$.quantity": Number(mat.quantity) },
          $set: { "items.$.lastUpdated": Date.now() }
        },
        { new: true }
      );

      if (!updateResult) {
        await Inventory.findOneAndUpdate(
          { siteId, ownerId },
          {
            $push: {
              items: {
                materialId: mat.materialId,
                materialName: mat.materialName,
                quantity: Number(mat.quantity),
                unit: mat.unit,
                lastUpdated: Date.now()
              }
            }
          },
          { upsert: true, new: true }
        );
      }
    }
    
    const mappedMaterials = materials.map(m => ({
      materialId: m.materialId,
      materialName: m.materialName,
      quantity: Number(m.quantity !== undefined ? m.quantity : m.qty),
      unit: m.unit,
      imageUrls: m.imageUrls || []
    }));

    const entryNo = `RCV-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const entry = new InventoryEntry({
      type: 'received',
      entryNo,
      siteId,
      ownerId,
      date: receivedDate || Date.now(),
      materials: mappedMaterials,
      notes,
      supplierName,
      challanNo,
      vehicleNo,
      imageUrls,
      createdBy: req.user._id
    });
    await entry.save();
    
    const populated = await InventoryEntry.findById(entry._id)
      .populate('siteId', 'siteName siteCode')
      .populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listReceivedEntries = async (req, res) => {
  const ownerId = req.user.role === 'owner' ? req.user._id : (req.user.ownerId || req.user.parentUserId);
  try {
    const { siteId, startDate, endDate, page = 1, limit = 10 } = req.query;
    let filter = { ownerId };
    
    let allowedSiteIds = [];
    if (req.user.role !== 'owner') {
      const sites = await Site.find({
        ownerId,
        $or: [
          { managerId: req.user._id },
          { _id: { $in: req.user.assignedSites || [] } }
        ]
      });
      allowedSiteIds = sites.map(s => s._id);
      filter.siteId = { $in: allowedSiteIds };
    }
    
    if (siteId) {
      if (req.user.role !== 'owner' && !allowedSiteIds.some(id => id.toString() === siteId.toString())) {
         return res.status(403).json({ message: 'Access denied to this site' });
      }
      filter.siteId = siteId;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    filter.type = 'received';
    const entries = await InventoryEntry.find(filter)
      .populate('siteId', 'siteName siteCode')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await InventoryEntry.countDocuments(filter);
      
    res.json({ 
      success: true, 
      data: entries,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReceivedEntry = async (req, res) => {
  const ownerId = req.user.role === 'owner' ? req.user._id : (req.user.ownerId || req.user.parentUserId);
  try {
    const entry = await InventoryEntry.findOne({ _id: req.params.entryId, ownerId })
      .populate('siteId', 'siteName siteCode')
      .populate('createdBy', 'name email');
      
    if (!entry) return res.status(404).json({ message: 'Not found or not authorized' });
    
    const site = await Site.findOne({
      _id: entry.siteId._id,
      ownerId,
      ...(req.user.role !== 'owner' ? {
        $or: [
          { managerId: req.user._id },
          { _id: { $in: req.user.assignedSites || [] } }
        ]
      } : {})
    });
    if (!site) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createUsedEntry = async (req, res) => {
  const ownerId = req.user.role === 'owner' ? req.user._id : (req.user.ownerId || req.user.parentUserId);
  try {
    const { siteId, usedDate, materials, notes, imageUrls } = req.body;
    
    const site = await Site.findOne({
      _id: siteId,
      ownerId,
      ...(req.user.role !== 'owner' ? {
        $or: [
          { managerId: req.user._id },
          { _id: { $in: req.user.assignedSites || [] } }
        ]
      } : {})
    });
    if (!site) {
      return res.status(403).json({ message: 'Access denied to this site' });
    }
    if (!materials || materials.length === 0) {
      return res.status(400).json({ message: 'Materials required' });
    }
    if (imageUrls && imageUrls.length > 5) {
      return res.status(400).json({ message: 'Max 5 images allowed per entry' });
    }

    const inventory = await Inventory.findOne({ siteId, ownerId });

    if (!inventory) {
      return res.status(400).json({ message: 'No inventory exists for this site' });
    }
    
    for (let mat of materials) {
      if ((mat.quantity !== undefined ? mat.quantity : mat.qty) <= 0) {
        return res.status(400).json({ message: `Invalid quantity for ${mat.materialName}` });
      }
      if (mat.imageUrls && mat.imageUrls.length > 5) {
        return res.status(400).json({ message: `Max 5 images per material (${mat.materialName})` });
      }
      
      const itemInInv = inventory.items.find(item => item.materialId && item.materialId.toString() === mat.materialId.toString());
      const availableStock = itemInInv ? itemInInv.quantity : 0;
      const reqQty = mat.quantity !== undefined ? mat.quantity : mat.qty;

      if (availableStock < reqQty) {
        return res.status(400).json({
          message: `Insufficient stock for ${mat.materialName}. Available: ${availableStock}, Requested: ${reqQty}`
        });
      }

      const updateResult = await Inventory.findOneAndUpdate(
        { 
          siteId, 
          ownerId,
          items: { $elemMatch: { materialId: mat.materialId, quantity: { $gte: Number(mat.quantity !== undefined ? mat.quantity : mat.qty) } } }
        },
        { 
          $inc: { "items.$.quantity": -Number(mat.quantity !== undefined ? mat.quantity : mat.qty) },
          $set: { "items.$.lastUpdated": Date.now() }
        },
        { new: true }
      );

      if (!updateResult) {
        return res.status(400).json({
          message: `Insufficient stock for ${mat.materialName}. Available stock changed during processing.`
        });
      }
    }
    
    const mappedMaterials = materials.map(m => ({
      materialId: m.materialId,
      materialName: m.materialName,
      quantity: Number(m.quantity !== undefined ? m.quantity : m.qty),
      unit: m.unit,
      imageUrls: m.imageUrls || []
    }));

    const entryNo = `USE-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const entry = new InventoryEntry({
      type: 'used',
      entryNo,
      siteId,
      ownerId,
      date: usedDate || Date.now(),
      materials: mappedMaterials,
      notes,
      imageUrls,
      createdBy: req.user._id
    });
    await entry.save();
    
    const populated = await InventoryEntry.findById(entry._id)
      .populate('siteId', 'siteName siteCode')
      .populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listUsedEntries = async (req, res) => {
  const ownerId = req.user.role === 'owner' ? req.user._id : (req.user.ownerId || req.user.parentUserId);
  try {
    const { siteId, startDate, endDate, page = 1, limit = 10 } = req.query;
    let filter = { ownerId };
    
    let allowedSiteIds = [];
    if (req.user.role !== 'owner') {
      const sites = await Site.find({
        ownerId,
        $or: [
          { managerId: req.user._id },
          { _id: { $in: req.user.assignedSites || [] } }
        ]
      });
      allowedSiteIds = sites.map(s => s._id);
      filter.siteId = { $in: allowedSiteIds };
    }
    
    if (siteId) {
      if (req.user.role !== 'owner' && !allowedSiteIds.some(id => id.toString() === siteId.toString())) {
         return res.status(403).json({ message: 'Access denied to this site' });
      }
      filter.siteId = siteId;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    filter.type = 'used';
    const entries = await InventoryEntry.find(filter)
      .populate('siteId', 'siteName siteCode')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await InventoryEntry.countDocuments(filter);
      
    res.json({ 
      success: true, 
      data: entries,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsedEntry = async (req, res) => {
  const ownerId = req.user.role === 'owner' ? req.user._id : (req.user.ownerId || req.user.parentUserId);
  try {
    const entry = await InventoryEntry.findOne({ _id: req.params.entryId, ownerId })
      .populate('siteId', 'siteName siteCode')
      .populate('createdBy', 'name email');
    if (!entry) return res.status(404).json({ message: 'Not found or not authorized' });
    
    const site = await Site.findOne({
      _id: entry.siteId._id,
      ownerId,
      ...(req.user.role !== 'owner' ? {
        $or: [
          { managerId: req.user._id },
          { _id: { $in: req.user.assignedSites || [] } }
        ]
      } : {})
    });
    if (!site) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMaterialStock = async (req, res) => {
  const ownerId = req.user.role === 'owner' ? req.user._id : (req.user.ownerId || req.user.parentUserId);
  try {
    const { siteId, materialId } = req.query;
    if (!siteId || !materialId) {
      return res.status(400).json({ success: false, message: 'siteId and materialId required' });
    }
    const site = await Site.findOne({
      _id: siteId,
      ownerId,
      ...(req.user.role !== 'owner' ? {
        $or: [
          { managerId: req.user._id },
          { _id: { $in: req.user.assignedSites || [] } }
        ]
      } : {})
    });
    if (!site) {
      return res.status(403).json({ success: false, message: 'Access denied to this site' });
    }
    const inventory = await Inventory.findOne({ siteId, ownerId });
    if (!inventory) {
      return res.json({ success: true, stock: 0, unit: '' });
    }
    const item = inventory.items.find(i => i.materialId && i.materialId.toString() === materialId.toString());
    if (!item) {
      return res.json({ success: true, stock: 0, unit: '' });
    }
    const material = await Material.findOne({ _id: materialId, ownerId });
    const unit = material?.unit || '';
    return res.json({ success: true, stock: item.quantity, unit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
