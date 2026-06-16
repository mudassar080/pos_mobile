const PurchaseReturn = require('../models/PurchaseReturn');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

// @desc    Get all purchase returns
// @route   GET /api/purchase-returns
// @access  Public
const getPurchaseReturns = async (req, res) => {
  try {
    const paging = parsePagination(req, res);
    if (!paging) return;

    const { page, limit, skip } = paging;
    const {
      search,
      supplier,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { returnNumber: { $regex: search, $options: 'i' } },
        { purchaseNumber: { $regex: search, $options: 'i' } },
        { supplierName: { $regex: search, $options: 'i' } },
      ];
    }

    if (supplier) {
      query.supplier = supplier;
    }

    if (status) {
      query.status = status;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const returns = await PurchaseReturn.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('supplier', 'name phone')
      .populate('purchase', 'purchaseNumber');

    const total = await PurchaseReturn.countDocuments(query);

    res.status(200).json({
      success: true,
      data: returns,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase returns',
      error: error.message,
    });
  }
};

// @desc    Get single purchase return
// @route   GET /api/purchase-returns/:id
// @access  Public
const getPurchaseReturn = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findById(req.params.id)
      .populate('supplier', 'name phone email')
      .populate('purchase');

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: 'Purchase return not found',
      });
    }

    res.status(200).json({
      success: true,
      data: purchaseReturn,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase return',
      error: error.message,
    });
  }
};

// @desc    Get already-returned quantities for a specific purchase
// @route   GET /api/purchase-returns/returned-quantities/:purchaseId
// @access  Public
const getReturnedQuantities = async (req, res) => {
  try {
    const { purchaseId } = req.params;

    const existingReturns = await PurchaseReturn.find({ purchase: purchaseId });

    const returnedMap = {};
    for (const ret of existingReturns) {
      for (const item of ret.items) {
        const key = item.imei || item.product.toString();
        returnedMap[key] = (returnedMap[key] || 0) + item.quantity;
      }
    }

    res.status(200).json({
      success: true,
      data: returnedMap,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching returned quantities',
      error: error.message,
    });
  }
};

// @desc    Create purchase return
// @route   POST /api/purchase-returns
// @access  Public
//
// Flow example:
//   Purchase: amount=10, paid=5, balance=5. Supplier outstanding=5.
//   Return items at returnPrice=10 → supplier payable: 5 - 10 = -5 (supplier owes us 5).
//   Return items at returnPrice=3  → supplier payable: 5 - 3 = 2  (we still owe 2).
//
const createPurchaseReturn = async (req, res) => {
  try {
    const { purchase: purchaseId, items, reason, notes, refundMethod } = req.body;

    // Get the original purchase
    const purchase = await Purchase.findById(purchaseId).populate('supplier');
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found',
      });
    }

    if (purchase.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot return items from a cancelled purchase',
      });
    }

    // Get already-returned quantities for this purchase
    const existingReturns = await PurchaseReturn.find({ purchase: purchaseId });
    const alreadyReturned = {};
    for (const ret of existingReturns) {
      for (const item of ret.items) {
        const key = item.imei || item.product.toString();
        alreadyReturned[key] = (alreadyReturned[key] || 0) + item.quantity;
      }
    }

    // Validate and prepare return items
    let totalAmount = 0;
    let totalProfit = 0;
    let originalPriceTotal = 0;
    const returnItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }

      // Check remaining returnable quantity
      const key = item.imei || item.product;
      const alreadyReturnedQty = alreadyReturned[key] || 0;
      const purchaseItem = purchase.items.find(
        (pi) => (item.imei && pi.imei === item.imei) || pi.product.toString() === item.product
      );

      if (!purchaseItem) {
        return res.status(400).json({
          success: false,
          message: `Item not found in original purchase: ${product.name}`,
        });
      }

      const maxReturnable = purchaseItem.quantity - alreadyReturnedQty;
      if (item.quantity > maxReturnable) {
        return res.status(400).json({
          success: false,
          message: `Cannot return ${item.quantity} of ${product.name}. Only ${maxReturnable} remaining (${alreadyReturnedQty} already returned).`,
        });
      }

      const originalPrice = item.price;
      const returnPrice = item.returnPrice !== undefined ? item.returnPrice : item.price;
      const itemProfit = (returnPrice - originalPrice) * item.quantity;
      const itemTotal = returnPrice * item.quantity;
      totalAmount += itemTotal;
      totalProfit += itemProfit;
      originalPriceTotal += originalPrice * item.quantity;

      returnItems.push({
        product: item.product,
        productName: product.name,
        imei: item.imei || null,
        quantity: item.quantity,
        originalPrice: originalPrice,
        returnPrice: returnPrice,
        price: returnPrice,
        total: itemTotal,
        profit: itemProfit,
      });

      // Update product stock
      if (item.imei) {
        product.status = 'returned';
        await product.save();
      } else {
        product.quantity = Math.max(0, product.quantity - item.quantity);
        await product.save();
      }
    }

    // Create the purchase return record
    const purchaseReturn = await PurchaseReturn.create({
      purchase: purchaseId,
      purchaseNumber: purchase.purchaseNumber,
      supplier: purchase.supplier._id,
      supplierName: purchase.supplierName,
      items: returnItems,
      amount: totalAmount,
      profit: totalProfit,
      reason: reason || 'Defective',
      notes: notes || '',
      refundMethod: refundMethod || 'Credit',
    });

    // ── Update the original Purchase record ──
    // Reduce purchase amount by original cost of returned items
    purchase.amount = Math.max(0, purchase.amount - originalPriceTotal);
    // Balance can go negative (means supplier owes us, we overpaid)
    purchase.balance = purchase.amount - purchase.paid;

    // Update purchase status
    if (purchase.amount <= 0) {
      purchase.status = 'paid';
    } else if (purchase.balance <= 0) {
      purchase.status = 'paid';
    } else if (purchase.paid > 0) {
      purchase.status = 'partial';
    } else {
      purchase.status = 'credit';
    }

    await purchase.save();

    // ── Adjust supplier payable ──
    // Supplier payable is reduced by the RETURN PRICE (what supplier credits/refunds us)
    // Credit: deducted from what we owe
    // Cash: supplier pays us back in cash
    // Both reduce the supplier's outstanding from our perspective
    // Replacement: no financial adjustment
    if (refundMethod !== 'Replacement') {
      await Supplier.findByIdAndUpdate(purchase.supplier._id, {
        $inc: {
          totalPurchases: -originalPriceTotal,
          outstanding: -totalAmount,
        },
      });
    } else {
      await Supplier.findByIdAndUpdate(purchase.supplier._id, {
        $inc: {
          totalPurchases: -originalPriceTotal,
        },
      });
    }

    // ── Auto-settle with linked customer ──
    // When return causes supplier outstanding to go negative (they owe us),
    // transfer the excess to the linked customer as receivable.
    // Example: payable was 5, return = 10 → outstanding = -5
    //   → supplier outstanding becomes 0, customer receivable += 5
    const supplier = await Supplier.findById(purchase.supplier._id);
    let linkedSettlement = null;

    if (supplier && supplier.linkedCustomer && supplier.outstanding < 0) {
      const linkedCustomer = await Customer.findById(supplier.linkedCustomer);

      if (linkedCustomer) {
        // Transfer the full negative amount as receivable on customer side
        const transferAmount = Math.abs(supplier.outstanding);

        supplier.outstanding = 0;
        await supplier.save();

        linkedCustomer.outstanding += transferAmount;
        await linkedCustomer.save();

        linkedSettlement = {
          customerName: linkedCustomer.name,
          customerId: linkedCustomer._id,
          transferredToReceivable: transferAmount,
          newSupplierOutstanding: 0,
          newCustomerOutstanding: linkedCustomer.outstanding,
        };

        purchaseReturn.linkedCustomer = linkedCustomer._id;
        purchaseReturn.linkedTransferAmount = transferAmount;
        await purchaseReturn.save();
      }
    }

    const message = linkedSettlement
      ? `Return created. Supplier payable cleared. ${linkedSettlement.transferredToReceivable} added as receivable to customer ${linkedSettlement.customerName}.`
      : `Return created. Supplier payable adjusted by ${totalAmount}.`;

    res.status(201).json({
      success: true,
      message,
      data: purchaseReturn,
      linkedSettlement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating purchase return',
      error: error.message,
    });
  }
};

// @desc    Delete purchase return (reverses all adjustments)
// @route   DELETE /api/purchase-returns/:id
// @access  Public
const deletePurchaseReturn = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findById(req.params.id);

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: 'Purchase return not found',
      });
    }

    // Restore product stock
    for (const item of purchaseReturn.items) {
      const product = await Product.findById(item.product);
      if (product) {
        if (item.imei) {
          product.status = 'available';
          await product.save();
        } else {
          product.quantity += item.quantity;
          await product.save();
        }
      }
    }

    // Calculate original price total
    const originalPriceTotal = purchaseReturn.items.reduce(
      (sum, item) => sum + (item.originalPrice || item.price) * item.quantity,
      0
    );
    const totalAmount = purchaseReturn.amount;

    const supplier = await Supplier.findById(purchaseReturn.supplier);

    // Restore the original Purchase record
    const purchase = await Purchase.findById(purchaseReturn.purchase);
    if (purchase) {
      purchase.amount += originalPriceTotal;
      purchase.balance = purchase.amount - purchase.paid;

      if (purchase.balance <= 0) {
        purchase.status = 'paid';
      } else if (purchase.paid > 0) {
        purchase.status = 'partial';
      } else {
        purchase.status = 'credit';
      }

      await purchase.save();
    }

    // Reverse linked customer transfer created during return creation, if any.
    if (purchaseReturn.linkedCustomer && purchaseReturn.linkedTransferAmount > 0) {
      const linkedCustomer = await Customer.findById(purchaseReturn.linkedCustomer);
      const transferAmount = purchaseReturn.linkedTransferAmount;

      if (linkedCustomer) {
        linkedCustomer.outstanding -= transferAmount;
        await linkedCustomer.save();
      }

      if (supplier) {
        supplier.outstanding -= transferAmount;
      }
    }

    // Reverse supplier payable adjustment
    if (supplier) {
      supplier.totalPurchases += originalPriceTotal;
      if (purchaseReturn.refundMethod !== 'Replacement') {
        supplier.outstanding += totalAmount;
      }
      await supplier.save();
    } else if (purchaseReturn.refundMethod !== 'Replacement') {
      await Supplier.findByIdAndUpdate(purchaseReturn.supplier, {
        $inc: {
          totalPurchases: originalPriceTotal,
          outstanding: totalAmount,
        },
      });
    } else {
      await Supplier.findByIdAndUpdate(purchaseReturn.supplier, {
        $inc: {
          totalPurchases: originalPriceTotal,
        },
      });
    }

    await PurchaseReturn.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Purchase return deleted. Stock and supplier balance restored.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting purchase return',
      error: error.message,
    });
  }
};

// @desc    Get purchase return summary
// @route   GET /api/purchase-returns/summary
// @access  Public
const getPurchaseReturnSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const matchQuery = {};

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const summary = await PurchaseReturn.aggregate([
      {
        $facet: {
          total: [
            { $match: matchQuery },
            { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } },
          ],
          today: [
            {
              $match: {
                ...matchQuery,
                date: { $gte: todayStart, $lt: todayEnd },
              },
            },
            { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } },
          ],
          thisMonth: [
            {
              $match: {
                ...matchQuery,
                date: { $gte: startOfMonth },
              },
            },
            { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } },
          ],
          byReason: [
            { $match: matchQuery },
            { $group: { _id: '$reason', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
          ],
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalReturns: summary[0].total[0]?.count || 0,
        totalAmount: summary[0].total[0]?.amount || 0,
        todayReturns: summary[0].today[0]?.count || 0,
        todayAmount: summary[0].today[0]?.amount || 0,
        thisMonthReturns: summary[0].thisMonth[0]?.count || 0,
        thisMonthAmount: summary[0].thisMonth[0]?.amount || 0,
        byReason: summary[0].byReason || [],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase return summary',
      error: error.message,
    });
  }
};

module.exports = {
  getPurchaseReturns,
  getPurchaseReturn,
  getReturnedQuantities,
  createPurchaseReturn,
  deletePurchaseReturn,
  getPurchaseReturnSummary,
};
