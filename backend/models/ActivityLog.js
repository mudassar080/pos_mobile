const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userName: {
      type: String,
      trim: true,
      default: 'Unknown',
    },
    userEmail: {
      type: String,
      trim: true,
      default: '',
    },
    userRole: {
      type: String,
      trim: true,
      default: 'unknown',
    },
    action: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'create',
        'update',
        'delete',
        'login',
        'payment',
        'cancel',
        'stock_update',
      ],
    },
    entity: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'auth',
        'product',
        'sale',
        'purchase',
        'expense',
        'user',
        'customer',
        'supplier',
        'sale_return',
        'purchase_return',
        'other_income',
        'settings',
      ],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    entityLabel: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ entity: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ entityLabel: 'text', description: 'text', userName: 'text' });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
