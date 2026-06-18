const { check, param } = require('express-validator');

const createMaterialValidation = [
  check('materialName', 'Material name is required').notEmpty().trim().escape(),
  check('unit', 'Unit is required').notEmpty().trim().escape(),
  check('category', 'Category must be a string').optional().isString().trim().escape()
];

const updateMaterialValidation = [
  param('materialId', 'Invalid material ID').isMongoId(),
  check('materialName', 'Material name cannot be empty').optional().notEmpty().trim().escape(),
  check('unit', 'Unit cannot be empty').optional().notEmpty().trim().escape(),
  check('category', 'Category must be a string').optional().isString().trim().escape(),
  check('status', 'Status must be active or inactive').optional().isIn(['active', 'inactive'])
];

const getMaterialByIdValidation = [
  param('materialId', 'Invalid material ID').isMongoId()
];

const deleteMaterialValidation = [
  param('materialId', 'Invalid material ID').isMongoId()
];

module.exports = {
  createMaterialValidation,
  updateMaterialValidation,
  getMaterialByIdValidation,
  deleteMaterialValidation
};
