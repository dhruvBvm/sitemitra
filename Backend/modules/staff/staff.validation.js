const { check, param } = require('express-validator');

const getSiteDetailsValidation = [
  param('siteId').isMongoId()
];

const createManualRequestValidation = [
  check('siteId').isMongoId(),
  check('notes').optional().trim().escape(),
  check('userNotes').optional().trim().escape(),
  check('materials').custom((value) => {
    if (!Array.isArray(value)) throw new Error('Materials must be an array');
    for (let m of value) {
      if (!(m.materialName || m.name)) throw new Error('Material name is required');
      if (!(m.quantity || m.qty) || Number(m.quantity || m.qty) <= 0) throw new Error('Valid quantity is required');
    }
    return true;
  })
];

const createPhotoRequestValidation = [
  check('siteId').isMongoId(),
  check('notes').optional().trim().escape(),
  check('userNotes').optional().trim().escape()
];

const getRequestByIdValidation = [
  param('requestId').isMongoId()
];

module.exports = {
  getSiteDetailsValidation,
  createManualRequestValidation,
  createPhotoRequestValidation,
  getRequestByIdValidation
};
