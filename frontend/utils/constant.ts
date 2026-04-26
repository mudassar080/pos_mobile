// Payment modes used across the app
export const PAYMENT_MODES = ['Cash', 'Online'] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

// Refund methods used for returns
export const REFUND_METHODS = ['Cash', 'Credit', 'Replacement'] as const;
export type RefundMethod = (typeof REFUND_METHODS)[number];

// Currency configuration
export const CURRENCY = 'PKR';
export const CURRENCY_SYMBOL = 'PKR';

// Format currency helper
export const formatCurrency = (amount: number | undefined | null): string => {
  return `${CURRENCY_SYMBOL}${(amount ?? 0).toLocaleString()}`;
};