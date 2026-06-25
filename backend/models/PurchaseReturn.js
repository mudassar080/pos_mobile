const mongoose = require('mongoose');
const { generateNextDocumentNumber } = require('../utils/generateDocumentNumber');

const purchaseReturnItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  imei: {
    type: String,
    default: null,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1,
  },
  originalPrice: {
    type: Number,
    default: 0,
  },
  returnPrice: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
  },
  total: {
    type: Number,
    required: true,
  },
  profit: {
    type: Number,
    default: 0,
  },
});

const purchaseReturnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      unique: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      required: true,
    },
    purchaseNumber: {
      type: String,
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    items: [purchaseReturnItemSchema],
    itemsCount: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    profit: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      enum: ['Defective', 'Wrong Item', 'Damaged', 'Expired', 'Other'],
      default: 'Defective',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'completed', 'rejected'],
      default: 'completed',
    },
    refundMethod: {
      type: String,
      enum: ['Cash', 'Credit', 'Replacement'],
      default: 'Credit',
    },
    linkedCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    linkedTransferAmount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Generate return number before saving
purchaseReturnSchema.pre('save', async function (next) {
  if (!this.returnNumber) {
    try {
      this.returnNumber = await generateNextDocumentNumber(
        this.constructor,
        'returnNumber',
        'PRET',
        3
      );
    } catch (error) {
      return next(error);
    }
  }
  // Calculate items count
  this.itemsCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  next();
});

// Index for faster searches
purchaseReturnSchema.index({ returnNumber: 'text', supplierName: 'text', purchaseNumber: 'text' });
purchaseReturnSchema.index({ date: -1 });
purchaseReturnSchema.index({ supplier: 1 });
purchaseReturnSchema.index({ purchase: 1 });

module.exports = mongoose.model('PurchaseReturn', purchaseReturnSchema);
