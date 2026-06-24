const SaleReturn = require('../models/SaleReturn');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

function getSaleCustomerId(sale) {
  if (!sale?.customer) return null;
  return sale.customer._id || sale.customer;
}

function getProductId(product) {
  if (!product) return '';
  if (typeof product === 'object' && product._id) return String(product._id);
  return String(product);
}

function getReturnItemKey(item) {
  return item.imei || getProductId(item.product);
}

function getSaleLineItemKey(saleItem) {
  return saleItem.imei || getProductId(saleItem.product);
}

async function getReturnedQuantityMapForSale(saleId) {
  const existingReturns = await SaleReturn.find({ sale: saleId });
  const returnedMap = {};

  for (const ret of existingReturns) {
    for (const item of ret.items) {
      const key = getReturnItemKey(item);
      returnedMap[key] = (returnedMap[key] || 0) + item.quantity;
    }
  }

  return returnedMap;
}

function findSaleLineItem(sale, item) {
  const productId = getProductId(item.product);
  return sale.items.find(
    (saleItem) =>
      (item.imei && saleItem.imei === item.imei) ||
      getProductId(saleItem.product) === productId
  );
}

function isSaleFullyReturned(sale, returnedMap) {
  return sale.items.every((saleItem) => {
    const key = getSaleLineItemKey(saleItem);
    return (returnedMap[key] || 0) >= saleItem.quantity;
  });
}

async function syncSaleReturnStatus(sale) {
  const returnedMap = await getReturnedQuantityMapForSale(sale._id);

  if (isSaleFullyReturned(sale, returnedMap)) {
    sale.status = 'returned';
  } else if (sale.status === 'returned') {
    if (sale.paid >= sale.amount) {
      sale.status = 'paid';
    } else if (sale.paid > 0) {
      sale.status = 'partial';
    } else {
      sale.status = 'credit';
    }
  }

  await sale.save();
}

// @desc    Get all sale returns
// @route   GET /api/sale-returns
// @access  Public
const getSaleReturns = async (req, res) => {
  try {
    const paging = parsePagination(req, res);
    if (!paging) return;

    const { page, limit, skip } = paging;
    const {
      search,
      customer,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { returnNumber: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }

    if (customer) {
      query.customer = customer;
    }

    if (status) {
      query.status = status;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const returns = await SaleReturn.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('customer', 'name phone')
      .populate('sale', 'invoiceNumber')
      .populate('items.product', 'name brand model category imei purchasePrice sellingPrice');

    const total = await SaleReturn.countDocuments(query);

    res.status(200).json({
      success: true,
      data: returns,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sale returns',
      error: error.message,
    });
  }
};

// @desc    Get single sale return
// @route   GET /api/sale-returns/:id
// @access  Public
const getSaleReturn = async (req, res) => {
  try {
    const saleReturn = await SaleReturn.findById(req.params.id)
      .populate('customer', 'name phone email')
      .populate('sale')
      .populate('items.product', 'name brand model category imei purchasePrice sellingPrice');

    if (!saleReturn) {
      return res.status(404).json({
        success: false,
        message: 'Sale return not found',
      });
    }

    res.status(200).json({
      success: true,
      data: saleReturn,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sale return',
      error: error.message,
    });
  }
};

// @desc    Get sales that still have items available to return
// @route   GET /api/sale-returns/returnable-sales
// @access  Public
const getReturnableSales = async (req, res) => {
  try {
    const sales = await Sale.find({ status: { $nin: ['cancelled', 'returned'] } })
      .populate('customer', 'name phone')
      .populate(
        'items.product',
        'name category brand model purchasePrice sellingPrice imei'
      )
      .sort({ date: -1 })
      .limit(500);

    const returnable = [];

    for (const sale of sales) {
      const returnedMap = await getReturnedQuantityMapForSale(sale._id);

      if (isSaleFullyReturned(sale, returnedMap)) {
        if (sale.status !== 'returned') {
          sale.status = 'returned';
          await sale.save();
        }
        continue;
      }

      returnable.push(sale);
    }

    res.status(200).json({
      success: true,
      data: returnable,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching returnable sales',
      error: error.message,
    });
  }
};

// @desc    Get already-returned quantities for a specific sale
// @route   GET /api/sale-returns/returned-quantities/:saleId
// @access  Public
const getReturnedQuantities = async (req, res) => {
  try {
    const { saleId } = req.params;
    const returnedMap = await getReturnedQuantityMapForSale(saleId);

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

// @desc    Create sale return
// @route   POST /api/sale-returns
// @access  Public
const createSaleReturn = async (req, res) => {
  try {
    const { sale: saleId, items, reason, notes, refundMethod } = req.body;

    // Get the original sale
    const sale = await Sale.findById(saleId).populate('customer');
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }

    if (!items?.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required for a sale return',
      });
    }

    if (sale.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot return items from a cancelled sale',
      });
    }

    if (sale.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'All items from this sale have already been returned',
      });
    }

    const customerId = getSaleCustomerId(sale);
    const resolvedRefundMethod = refundMethod || 'Cash';

    if (resolvedRefundMethod === 'Credit' && !customerId) {
      return res.status(400).json({
        success: false,
        message: 'Credit refund is not available for walk-in sales without a customer',
      });
    }

    const alreadyReturned = await getReturnedQuantityMapForSale(saleId);

    // Calculate total amount, profit, and cost impact (loss/profit vs purchase price)
    let totalAmount = 0;
    let totalProfit = 0;
    let totalCostImpact = 0;
    const returnItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }

      const key = getReturnItemKey(item);
      const alreadyReturnedQty = alreadyReturned[key] || 0;
      const saleItem = findSaleLineItem(sale, item);

      if (!saleItem) {
        return res.status(400).json({
          success: false,
          message: `Item not found in original sale: ${product.name}`,
        });
      }

      const maxReturnable = saleItem.quantity - alreadyReturnedQty;
      if (item.quantity > maxReturnable) {
        return res.status(400).json({
          success: false,
          message: `Cannot return ${item.quantity} of ${product.name}. Only ${maxReturnable} remaining (${alreadyReturnedQty} already returned).`,
        });
      }

      // originalPrice = what we sold it for (from the sale)
      const originalPrice = item.price;
      // returnPrice = what we take it back for (user enters this, could be less)
      const returnPrice = item.returnPrice !== undefined ? item.returnPrice : item.price;
      // profit = difference we keep (sold at 1000, returned at 800 = 200 profit)
      const itemProfit = (originalPrice - returnPrice) * item.quantity;
      const itemTotal = returnPrice * item.quantity;
      totalAmount += itemTotal;
      totalProfit += itemProfit;

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
        condition: item.condition || 'resellable',
      });

      // Cost impact: purchasePrice - returnPrice. Positive = profit, negative = loss
      const purchasePrice = product.purchasePrice || 0;
      const costImpact = (purchasePrice - returnPrice) * item.quantity;
      totalCostImpact += costImpact;

      returnItems[returnItems.length - 1].purchasePrice = purchasePrice;
      returnItems[returnItems.length - 1].costImpact = costImpact;

      // Update product stock — keep original purchase price (do not overwrite with return price)
      if (product.imei) {
        if (item.condition === 'resellable') {
          product.status = 'available';
          product.soldDate = null;
          product.sellingPrice = product.purchasePrice;
        } else {
          product.status = 'damaged';
        }
        await product.save();
      } else {
        if (item.condition === 'resellable') {
          product.quantity = (product.quantity || 0) + item.quantity;
          product.sellingPrice = product.purchasePrice;
          await product.save();
        }
      }
    }

    // Create the sale return
    const saleReturn = await SaleReturn.create({
      sale: saleId,
      invoiceNumber: sale.invoiceNumber,
      customer: customerId,
      customerName: sale.customerName || 'Walk-in Customer',
      items: returnItems,
      amount: totalAmount,
      profit: totalProfit,
      costImpact: totalCostImpact,
      reason: reason || 'Defective',
      notes: notes || '',
      refundMethod: resolvedRefundMethod,
    });

    // Update customer outstanding — only refund the returnPrice amount
    if (resolvedRefundMethod === 'Credit' && customerId) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { outstanding: -totalAmount },
      });
    }

    await syncSaleReturnStatus(sale);

    res.status(201).json({
      success: true,
      message: 'Sale return created successfully',
      data: saleReturn,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating sale return',
      error: error.message,
    });
  }
};

// @desc    Delete sale return
// @route   DELETE /api/sale-returns/:id
// @access  Public
const deleteSaleReturn = async (req, res) => {
  try {
    const saleReturn = await SaleReturn.findById(req.params.id);

    if (!saleReturn) {
      return res.status(404).json({
        success: false,
        message: 'Sale return not found',
      });
    }

    // Reverse product stock changes
    for (const item of saleReturn.items) {
      const product = await Product.findById(item.product);
      if (product) {
        if (product.imei) {
          product.status = 'sold';
          product.soldDate = new Date();
          product.sellingPrice = item.originalPrice || item.price;
          await product.save();
        } else if (item.condition === 'resellable') {
          product.quantity = Math.max(0, (product.quantity || 0) - item.quantity);
          product.sellingPrice = item.originalPrice || item.price;
          await product.save();
        }
      }
    }

    // Restore customer outstanding if it was credited
    if (saleReturn.refundMethod === 'Credit' && saleReturn.customer) {
      await Customer.findByIdAndUpdate(saleReturn.customer, {
        $inc: { outstanding: saleReturn.amount },
      });
    }

    const saleId = saleReturn.sale;

    await SaleReturn.findByIdAndDelete(req.params.id);

    const sale = await Sale.findById(saleId);
    if (sale) {
      await syncSaleReturnStatus(sale);
    }

    res.status(200).json({
      success: true,
      message: 'Sale return deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting sale return',
      error: error.message,
    });
  }
};

// @desc    Get sale return summary
// @route   GET /api/sale-returns/summary
// @access  Public
const getSaleReturnSummary = async (req, res) => {
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

    const summary = await SaleReturn.aggregate([
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
      message: 'Error fetching sale return summary',
      error: error.message,
    });
  }
};

module.exports = {
  getSaleReturns,
  getSaleReturn,
  getReturnableSales,
  getReturnedQuantities,
  createSaleReturn,
  deleteSaleReturn,
  getSaleReturnSummary,
};
