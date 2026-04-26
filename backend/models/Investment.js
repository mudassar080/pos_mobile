const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Owner',
      required: [true, 'Owner is required'],
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: ['investment', 'withdrawal'],
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
investmentSchema.index({ type: 1 });
investmentSchema.index({ date: -1 });
investmentSchema.index({ owner: 1 });

module.exports = mongoose.model('Investment', investmentSchema);
