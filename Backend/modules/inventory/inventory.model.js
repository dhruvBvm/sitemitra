const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema({
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  materialName: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

const InventorySchema = new mongoose.Schema({
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true, unique: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [InventoryItemSchema],
  updatedAt: { type: Date, default: Date.now }
});


InventorySchema.pre('save', function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Inventory', InventorySchema);
