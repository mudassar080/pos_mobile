const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const OtherIncome = require('../models/OtherIncome');
const Investment = require('../models/Investment');
const SaleReturn = require('../models/SaleReturn');
const PurchaseReturn = require('../models/PurchaseReturn');

// @desc    Get cash in hand (total cash inflows - outflows)
// @route   GET /api/dashboard/cash-in-hand
// @access  Public
const getCashInHand = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateMatch = {};
    if (startDate || endDate) {
      dateMatch.date = {};
      if (startDate) dateMatch.date.$gte = new Date(startDate);
      if (endDate) dateMatch.date.$lte = new Date(endDate);
    }

    const [
      salesResult,
      purchasesResult,
      expensesResult,
      otherIncomeResult,
      investmentsResult,
      saleReturnResults,
      purchaseReturnResults,
    ] = await Promise.all([
      // Cash IN: Total paid received from sales (excluding cancelled)
      Sale.aggregate([
        { $match: { status: { $ne: 'cancelled' }, ...dateMatch } },
        { $group: { _id: null, total: { $sum: '$paid' } } },
      ]),
      // Cash OUT: Total paid to suppliers for purchases (excluding cancelled)
      Purchase.aggregate([
        { $match: { status: { $ne: 'cancelled' }, ...dateMatch } },
        { $group: { _id: null, total: { $sum: '$paid' } } },
      ]),
      // Cash OUT: Total expenses
      Expense.aggregate([
        { $match: dateMatch },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Cash IN: Total other income
      OtherIncome.aggregate([
        { $match: dateMatch },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Cash IN/OUT: Investments (investment = IN, withdrawal = OUT)
      Investment.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]),
      // Cash OUT: Sale returns by refund method
      SaleReturn.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: '$refundMethod',
            total: { $sum: '$amount' },
          },
        },
      ]),
      // Cash IN: Purchase returns by refund method
      PurchaseReturn.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: '$refundMethod',
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const salesPaid = salesResult[0]?.total || 0;
    const purchasesPaid = purchasesResult[0]?.total || 0;
    const totalExpenses = expensesResult[0]?.total || 0;
    const totalOtherIncome = otherIncomeResult[0]?.total || 0;

    const investmentIn = investmentsResult.find((i) => i._id === 'investment')?.total || 0;
    const investmentOut = investmentsResult.find((i) => i._id === 'withdrawal')?.total || 0;

    // Sale returns: Cash and Credit both reduce our cash position
    // (Cash = we refund cash, Credit = we owe them credit on next purchase)
    // Replacement = no financial impact
    const saleReturnCash = saleReturnResults.find((r) => r._id === 'Cash')?.total || 0;
    const saleReturnCredit = saleReturnResults.find((r) => r._id === 'Credit')?.total || 0;
    const saleReturnCashOut = saleReturnCash + saleReturnCredit;

    // Purchase returns: Cash and Credit both improve our cash position
    // (Cash = supplier refunds us cash, Credit = reduces our payable to supplier)
    // Replacement = no financial impact
    const purchaseReturnCash = purchaseReturnResults.find((r) => r._id === 'Cash')?.total || 0;
    const purchaseReturnCredit = purchaseReturnResults.find((r) => r._id === 'Credit')?.total || 0;
    const purchaseReturnCashIn = purchaseReturnCash + purchaseReturnCredit;

    const totalCashIn = salesPaid + totalOtherIncome + investmentIn + purchaseReturnCashIn;
    const totalCashOut = purchasesPaid + totalExpenses + investmentOut + saleReturnCashOut;
    const cashInHand = totalCashIn - totalCashOut;

    res.status(200).json({
      success: true,
      data: {
        cashInHand,
        totalCashIn,
        totalCashOut,
        breakdown: {
          salesPaid,
          otherIncome: totalOtherIncome,
          investmentIn,
          purchaseReturnCashIn,
          purchaseReturnCash,
          purchaseReturnCredit,
          purchasesPaid,
          expenses: totalExpenses,
          investmentOut,
          saleReturnCashOut,
          saleReturnCash,
          saleReturnCredit,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating cash in hand',
      error: error.message,
    });
  }
};

module.exports = {
  getCashInHand,
};
