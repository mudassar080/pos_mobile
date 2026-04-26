const SaleReturn = require('../models/SaleReturn');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// @desc    Get all sale returns
// @route   GET /api/sale-returns
// @access  Public
const getSaleReturns = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
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

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const returns = await SaleReturn.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('customer', 'name phone')
      .populate('sale', 'invoiceNumber');

    const total = await SaleReturn.countDocuments(query);

    res.status(200).json({
      success: true,
      data: returns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
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
      .populate('sale');

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
      customer: sale.customer._id,
      customerName: sale.customerName,
      items: returnItems,
      amount: totalAmount,
      profit: totalProfit,
      costImpact: totalCostImpact,
      reason: reason || 'Defective',
      notes: notes || '',
      refundMethod: refundMethod || 'Cash',
    });

    // Update customer outstanding — only refund the returnPrice amount
    if (refundMethod === 'Credit') {
      await Customer.findByIdAndUpdate(sale.customer._id, {
        $inc: { outstanding: -totalAmount },
      });
    }

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
    if (saleReturn.refundMethod === 'Credit') {
      await Customer.findByIdAndUpdate(saleReturn.customer, {
        $inc: { outstanding: saleReturn.amount },
      });
    }

    await SaleReturn.findByIdAndDelete(req.params.id);

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
  createSaleReturn,
  deleteSaleReturn,
  getSaleReturnSummary,
};
