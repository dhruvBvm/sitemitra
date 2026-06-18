const Material = require('../material/material.model');
const Inventory = require('../inventory/inventory.model');

// @desc    Create a new material
// @route   POST /api/owner/materials
// @access  Private/Owner
const createMaterial = async (req, res) => {
  const { materialName, unit, category } = req.body;
  const ownerId = req.user.role === 'owner' ? req.user._id : req.user.parentUserId;

  try {
    // Check for duplicate materialName within same owner
    const existing = await Material.findOne({ materialName, ownerId });
    if (existing) {
      return res.status(400).json({ message: 'Material with this name already exists' });
    }

    const material = await Material.create({
      materialName,
      unit,
      category: category || '',
      ownerId,
    });

    // Add the new material to all existing inventories of this owner with zero quantity
    try {
      const inventories = await Inventory.find({ ownerId });
      for (const inv of inventories) {
        inv.items.push({
          materialId: material._id,
          materialName: material.materialName,
          quantity: 0,
          lastUpdated: new Date()
        });
        await inv.save();
      }
    } catch (invErr) {
      console.error('Failed to add new material to inventories:', invErr);
    }
    res.status(201).json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a material
// @route   PUT /api/owner/materials/:materialId
// @access  Private/Owner
const updateMaterial = async (req, res) => {
  const { materialId } = req.params;
  const ownerId = req.user.role === 'owner' ? req.user._id : req.user.parentUserId;

  try {
    // If materialName is being updated, check uniqueness within same owner
    if (req.body.materialName) {
      const existing = await Material.findOne({
        materialName: req.body.materialName,
        ownerId,
        _id: { $ne: materialId }
      });
      if (existing) {
        return res.status(400).json({ message: 'Material with this name already exists' });
      }
    }

    const material = await Material.findOneAndUpdate(
      { _id: materialId, ownerId },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!material) {
      return res.status(404).json({ message: 'Material not found or not authorized' });
    }

    res.json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all materials with pagination and filters
// @route   GET /api/owner/materials
// @access  Private/Owner
const getAllMaterials = async (req, res) => {
  const { category, status = 'active', page, limit } = req.query;
  const ownerId = req.user.role === 'owner' ? req.user._id : req.user.parentUserId;

  try {
    const filter = { status, ownerId };
    if (status === 'all') delete filter.status;
    if (category) filter.category = category;

    if (page || limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const skip = (pageNum - 1) * limitNum;

      const materials = await Material.find(filter)
        .skip(skip)
        .limit(limitNum)
        .sort({ materialName: 1 });

      const total = await Material.countDocuments(filter);

      return res.json({
        success: true,
        data: materials,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } else {
      const materials = await Material.find(filter).sort({ materialName: 1 });
      return res.json({
        success: true,
        data: materials
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get material by ID
// @route   GET /api/owner/materials/:materialId
// @access  Private/Owner
const getMaterialById = async (req, res) => {
  const { materialId } = req.params;
  const ownerId = req.user.role === 'owner' ? req.user._id : req.user.parentUserId;

  try {
    const material = await Material.findOne({ _id: materialId, ownerId });
    if (!material) {
      return res.status(404).json({ message: 'Material not found or not authorized' });
    }

    res.json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Soft delete a material (set status to inactive)
// @route   DELETE /api/owner/materials/:materialId
// @access  Private/Owner
const deleteMaterial = async (req, res) => {
  const { materialId } = req.params;
  const ownerId = req.user.role === 'owner' ? req.user._id : req.user.parentUserId;

  try {
    const material = await Material.findOne({ _id: materialId, ownerId });
    if (!material) {
      return res.status(404).json({ message: 'Material not found or not authorized' });
    }

    material.status = 'inactive';
    await material.save();

    res.json({ success: true, message: 'Material deactivated successfully', data: material });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createMaterial,
  updateMaterial,
  getAllMaterials,
  getMaterialById,
  deleteMaterial
};
