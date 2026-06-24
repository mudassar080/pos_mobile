const mongoose = require('mongoose');

const saleReturnItemSchema = new mongoose.Schema({
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
  purchasePrice: {
    type: Number,
    default: 0,
  },
  costImpact: {
    type: Number,
    default: 0,
  },
  condition: {
    type: String,
    enum: ['resellable', 'damaged'],
    default: 'resellable',
  },
});

const saleReturnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      unique: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    customerName: {
      type: String,
      required: true,
    },
    items: [saleReturnItemSchema],
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
    costImpact: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      enum: ['Defective', 'Wrong Item', 'Not Satisfied', 'Damaged', 'Other'],
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
      default: 'Cash',
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
saleReturnSchema.pre('save', async function (next) {
  if (!this.returnNumber) {
    const count = await this.constructor.countDocuments();
    this.returnNumber = `RET${(count + 1).toString().padStart(3, '0')}`;
  }
  // Calculate items count
  this.itemsCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  next();
});

// Index for faster searches
saleReturnSchema.index({ returnNumber: 'text', customerName: 'text', invoiceNumber: 'text' });
saleReturnSchema.index({ date: -1 });
saleReturnSchema.index({ customer: 1 });
saleReturnSchema.index({ sale: 1 });

module.exports = mongoose.model('SaleReturn', saleReturnSchema);
