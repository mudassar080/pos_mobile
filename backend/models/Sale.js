const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
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

const salePaymentHistorySchema = new mongoose.Schema(
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
      enum: ['sale-create', 'sale-update-payment', 'customer-receipt'],
      default: 'sale-update-payment',
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

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: {
      type: String,
      default: 'Walk-in Customer',
    },
    items: [saleItemSchema],
    // Number of items (count)
    itemsCount: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      min: [0, 'Subtotal cannot be negative'],
      default: 0,
    },
    discountType: {
      type: String,
      enum: ['none', 'amount', 'percentage'],
      default: 'none',
    },
    discountValue: {
      type: Number,
      default: 0,
      min: [0, 'Discount value cannot be negative'],
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount cannot be negative'],
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
    paymentHistory: [salePaymentHistorySchema],
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Credit', 'Mixed'],
      default: 'Cash',
    },
    status: {
      type: String,
      enum: ['paid', 'partial', 'credit', 'cancelled', 'returned'],
      default: 'paid',
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

// Generate invoice number before saving
saleSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments();
    this.invoiceNumber = `INV${(count + 1).toString().padStart(3, '0')}`;
  }
  // Calculate items count
  this.itemsCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  next();
});

// Index for faster searches
saleSchema.index({ invoiceNumber: 'text', customerName: 'text' });
saleSchema.index({ date: -1 });
saleSchema.index({ customer: 1 });

module.exports = mongoose.model('Sale', saleSchema);
