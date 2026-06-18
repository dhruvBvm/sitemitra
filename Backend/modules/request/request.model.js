const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requestNo: {
    type: String,
    unique: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner ID is required']
  },
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: [true, 'Site is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  requestType: {
    type: String,
    enum: ['photo', 'manual'],
    default: 'manual'
  },
  materials: [
    {
      materialName: { type: String, required: true },
      quantity: { type: Number, required: true, min: 0 },
      imageUrls: { type: [String], default: [] },
      unit: { type: String, required: true },
      requiredDate: { type: Date },
      remarks: { type: String, default: '' }
    }
  ],
  imageUrls: {
    type: [String],
    default: []
  },
  notes: {
    type: String,
    default: ''
  },
  userNotes: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: [
      'draft',
      'submitted',
      'pending_manager',
      'approved_by_manager',
      'rejected_by_manager',
      'pending_owner',
      'approved',
      'rejected_by_owner',
      'purchase_requested',
      'delivered',
      'closed'
    ],
    default: 'draft'
  },
  approvalHistory: [
    {
      action: { type: String },
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      comment: { type: String, default: '' },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  generalNotes: [{
    text: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate requestNo before saving
requestSchema.pre('save', async function () {
  if (!this.requestNo) {
    const count = await mongoose.model('Request').countDocuments();
    this.requestNo = `REQ-${String(count + 1).padStart(6, '0')}`;
  }
});

module.exports = mongoose.model('Request', requestSchema);
