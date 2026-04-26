const mongoose = require('mongoose');

const otherIncomeSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Service', 'Commission', 'Old Phone Resale', 'Accessories Repair', 'Other'],
      default: 'Other',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Card'],
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

// Index for faster searches
otherIncomeSchema.index({ category: 1 });
otherIncomeSchema.index({ date: -1 });

module.exports = mongoose.model('OtherIncome', otherIncomeSchema);
