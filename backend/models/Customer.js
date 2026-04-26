const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    // Computed/tracked fields
    totalPurchases: {
      type: Number,
      default: 0,
      min: [0, 'Total purchases cannot be negative'],
    },
    outstanding: {
      type: Number,
      default: 0,
    },
    lastPurchase: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    linkedSupplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster searches
customerSchema.index({ name: 'text', phone: 'text', email: 'text' });
customerSchema.index({ linkedSupplier: 1 });

module.exports = mongoose.model('Customer', customerSchema);
