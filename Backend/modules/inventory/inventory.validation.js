const { check } = require('express-validator');

const createReceivedEntryValidator = [
  check('siteId').isMongoId(),
  check('date').optional().isISO8601(),
  check('supplierName').optional().trim().escape(),
  check('challanNo').optional().trim().escape(),
  check('vehicleNo').optional().trim().escape(),
  check('notes').optional().trim().escape(),
  check('materials').custom((value) => {
    const mongoose = require('mongoose');
    if (!Array.isArray(value)) throw new Error('Materials must be an array');
    for (let m of value) {
      if (!m.materialId) throw new Error('Material ID is required');
      if (!mongoose.Types.ObjectId.isValid(m.materialId)) throw new Error('Invalid Material ID format');
      if (!(m.quantity || m.qty) || Number(m.quantity || m.qty) < 0.01) throw new Error('Quantity must be positive');
      if (!m.unit) throw new Error('Unit is required');
    }
    return true;
  })
];

const createUsedEntryValidator = [
  check('siteId').isMongoId(),
  check('usedDate').optional().isISO8601(),
  check('notes').optional().trim().escape(),
  check('materials').custom((value) => {
    const mongoose = require('mongoose');
    if (!Array.isArray(value)) throw new Error('Materials must be an array');
    for (let m of value) {
      if (!m.materialId) throw new Error('Material ID is required');
      if (!mongoose.Types.ObjectId.isValid(m.materialId)) throw new Error('Invalid Material ID format');
      if (!(m.quantity || m.qty) || Number(m.quantity || m.qty) < 0.01) throw new Error('Quantity must be positive');
      if (!m.unit) throw new Error('Unit is required');
    }
    return true;
  })
];

module.exports = {
  createReceivedEntryValidator,
  createUsedEntryValidator
};
