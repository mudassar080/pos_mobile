/**
 * Calculate overall sale discount from line-item subtotal.
 * @param {number} subtotal
 * @param {'none'|'amount'|'percentage'} discountType
 * @param {number} discountValue
 */
function calculateSaleDiscount(subtotal, discountType = 'none', discountValue = 0) {
  const itemsTotal = Math.max(0, Number(subtotal) || 0);
  const value = Math.max(0, Number(discountValue) || 0);
  const type = discountType === 'amount' || discountType === 'percentage' ? discountType : 'none';

  if (type === 'none' || value <= 0) {
    return {
      subtotal: itemsTotal,
      discountType: 'none',
      discountValue: 0,
      discountAmount: 0,
      amount: itemsTotal,
    };
  }

  let discountAmount = 0;
  if (type === 'amount') {
    discountAmount = Math.min(value, itemsTotal);
  } else {
    const cappedPercent = Math.min(value, 100);
    discountAmount = Math.min(itemsTotal, (itemsTotal * cappedPercent) / 100);
  }

  return {
    subtotal: itemsTotal,
    discountType: type,
    discountValue: type === 'percentage' ? Math.min(value, 100) : value,
    discountAmount: Math.round(discountAmount * 100) / 100,
    amount: Math.round(Math.max(0, itemsTotal - discountAmount) * 100) / 100,
  };
}

module.exports = { calculateSaleDiscount };
