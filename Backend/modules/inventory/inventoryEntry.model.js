const mongoose = require('mongoose');

const EntryMaterialSchema = new mongoose.Schema({
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  materialName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0.01 },
  unit: { type: String, required: true },
  imageUrls: { type: [String], default: [] }
});

const InventoryEntrySchema = new mongoose.Schema({
  entryNo: { type: String, unique: true, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['received', 'used'], required: true },
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  date: { type: Date, default: Date.now },
  materials: [EntryMaterialSchema],
  notes: { type: String },
  supplierName: { type: String }, // specific to received
  challanNo: { type: String },    // specific to received
  vehicleNo: { type: String },    // specific to received
  imageUrls: { type: [String], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

InventoryEntrySchema.index({ siteId: 1, type: 1, createdAt: -1 });
InventoryEntrySchema.index({ type: 1, date: -1 });

module.exports = mongoose.model('InventoryEntry', InventoryEntrySchema);
