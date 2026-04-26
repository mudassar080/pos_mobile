const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
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
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
  },
  total: {
    type: Number,
    required: true,
  },
});

const purchasePaymentHistorySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: [0, 'Payment amount cannot be negative'],
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Credit', 'Mixed'],
      default: 'Cash',
    },
    source: {
      type: String,
      enum: ['purchase-create', 'purchase-update-payment', 'supplier-payment'],
      default: 'purchase-update-payment',
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    purchaseNumber: {
      type: String,
      unique: true,
    },
    date: {
      type: Date,
      default: Date.now,
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
    items: [purchaseItemSchema],
    // Number of items (count)
    itemsCount: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    paid: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },
    paymentHistory: [purchasePaymentHistorySchema],
    // Balance = amount - paid
    balance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['paid', 'partial', 'credit', 'cancelled'],
      default: 'credit',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
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

// Generate purchase number before saving
purchaseSchema.pre('save', async function (next) {
  if (!this.purchaseNumber) {
    const count = await this.constructor.countDocuments();
    this.purchaseNumber = `PUR${(count + 1).toString().padStart(3, '0')}`;
  }
  // Calculate items count
  this.itemsCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  // Calculate balance
  this.balance = this.amount - this.paid;
  next();
});

// Index for faster searches
purchaseSchema.index({ purchaseNumber: 'text', supplierName: 'text' });
purchaseSchema.index({ date: -1 });
purchaseSchema.index({ supplier: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
