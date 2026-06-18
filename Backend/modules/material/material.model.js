const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  materialName: {
    type: String,
    required: [true, 'Material name is required'],
    trim: true
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true
  },
  // Images for materials are stored in the request schema's material subdocument
  category: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

materialSchema.index({ materialName: 1, ownerId: 1 }, { unique: true });

module.exports = mongoose.model('Material', materialSchema);
