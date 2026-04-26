const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'Uncategorized',
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    model: {
      type: String,
      trim: true,
      default: '',
    },
    imei: {
      type: String,
      trim: true,
      default: null,
      sparse: true,
    },
    color: {
      type: String,
      trim: true,
      default: null,
    },
    purchasePrice: {
      type: Number,
      default: 0,
      min: [0, 'Purchase price cannot be negative'],
    },
    lastPurchasePrice: {
      type: Number,
      default: 0,
      min: [0, 'Last purchase price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      default: null,
      min: [0, 'Selling price cannot be negative'],
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },
    // Stock status for IMEI-based products (phones)
    status: {
      type: String,
      enum: ['available', 'sold', 'returned', 'damaged'],
      default: 'available',
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    soldDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster searches
productSchema.index({ name: 'text', category: 'text', brand: 'text', imei: 'text' });
productSchema.index({ imei: 1 }, { sparse: true });

const Product = mongoose.model('Product', productSchema);

// Drop old sku index if it exists (cleanup from old schema)
Product.collection.dropIndex('sku_1').catch(() => {
  // Index doesn't exist, ignore error
});

module.exports = Product;
