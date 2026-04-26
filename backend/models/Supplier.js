const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
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
    linkedCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster searches
supplierSchema.index({ name: 'text', phone: 'text', email: 'text' });
supplierSchema.index({ linkedCustomer: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
