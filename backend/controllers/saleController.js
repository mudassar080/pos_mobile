const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const logActivity = require('../utils/logActivity');

// @desc    Get all sales
// @route   GET /api/sales
// @access  Public
const getSales = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      customer,
      status,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
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

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const sales = await Sale.find(query)
      .populate('customer', 'name phone')
      .populate('items.product', 'name category brand purchasePrice')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Sale.countDocuments(query);

    res.status(200).json({
      success: true,
      data: sales,
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
      message: 'Error fetching sales',
      error: error.message,
    });
  }
};

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Public
const getSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer', 'name phone email address')
      .populate('items.product', 'name category brand');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }

    res.status(200).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sale',
      error: error.message,
    });
  }
};

// @desc    Create sale
// @route   POST /api/sales
// @access  Public
const createSale = async (req, res) => {
  try {
    const { items, customer, paid, paymentMode, notes } = req.body;

    // Validate and prepare items
    const preparedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }

      // Check stock for non-IMEI products
      if (!product.imei && product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}`,
        });
      }

      const price = item.price || product.sellingPrice || 0;
      const quantity = product.imei ? 1 : item.quantity;
      const itemTotal = price * quantity;

      preparedItems.push({
        product: product._id,
        productName: product.name,
        imei: item.imei || product.imei || null,
        quantity,
        price,
        total: itemTotal,
      });

      totalAmount += itemTotal;
    }

    // Get customer name if customer provided
    let customerName = 'Walk-in Customer';
    if (customer && customer !== 'walk-in') {
      const customerDoc = await Customer.findById(customer);
      if (customerDoc) {
        customerName = customerDoc.name;
      }
    }

    // Determine status
    const paidAmount = paid || 0;
    let status = 'credit';
    if (paidAmount >= totalAmount) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partial';
    }

    // Create sale
    const sale = await Sale.create({
      customer: customer && customer !== 'walk-in' ? customer : null,
      customerName,
      items: preparedItems,
      amount: totalAmount,
      paid: paidAmount,
      paymentHistory:
        paidAmount > 0
          ? [
              {
                amount: paidAmount,
                paymentMode: paymentMode || 'Cash',
                source: 'sale-create',
                note: 'Initial payment at sale creation',
                date: new Date(),
              },
            ]
          : [],
      paymentMode: paymentMode || 'Cash',
      status,
      notes,
      createdBy: req.user?._id || null,
    });

    // Update product quantities/status and selling price
    for (const item of preparedItems) {
      const product = await Product.findById(item.product);
      if (product.imei) {
        // Mark IMEI product as sold and update selling price
        await Product.findByIdAndUpdate(item.product, {
          status: 'sold',
          soldDate: new Date(),
          sellingPrice: item.price,
        });
      } else {
        // Reduce quantity and update selling price
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: -item.quantity },
          sellingPrice: item.price,
        });
      }
    }

    // Update customer stats
    if (customer && customer !== 'walk-in') {
      const outstanding = totalAmount - paidAmount;
      await Customer.findByIdAndUpdate(customer, {
        $inc: {
          totalPurchases: totalAmount,
          outstanding: outstanding,
        },
        lastPurchase: new Date(),
      });
    }

    await logActivity(req, {
      action: 'create',
      entity: 'sale',
      entityId: sale._id,
      entityLabel: sale.invoiceNumber,
      description: `Created sale ${sale.invoiceNumber} for ${customerName} (${totalAmount})`,
      metadata: { amount: totalAmount, paid: paidAmount },
    });

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: sale,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating sale',
      error: error.message,
    });
  }
};

// @desc    Update sale payment
// @route   PATCH /api/sales/:id/payment
// @access  Public
const updatePayment = async (req, res) => {
  try {
    const { amount, paymentMode } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment amount is required',
      });
    }

    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }

    if (sale.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Sale is already fully paid',
      });
    }

    const previousDue = sale.amount - sale.paid;
    const paymentApplied = Math.min(amount, previousDue);
    sale.paid += amount;

    if (sale.paid >= sale.amount) {
      sale.status = 'paid';
      sale.paid = sale.amount; // Cap at total amount
    } else {
      sale.status = 'partial';
    }

    if (paymentMode) {
      sale.paymentMode = sale.paid === amount ? paymentMode : 'Mixed';
    }

    if (paymentApplied > 0) {
      sale.paymentHistory = sale.paymentHistory || [];
      sale.paymentHistory.push({
        amount: paymentApplied,
        paymentMode: paymentMode || sale.paymentMode || 'Cash',
        source: 'sale-update-payment',
        note: 'Additional payment received on sale',
        date: new Date(),
      });
    }

    await sale.save();

    // Update customer outstanding
    if (sale.customer) {
      const paymentReceived = Math.min(amount, previousDue);
      await Customer.findByIdAndUpdate(sale.customer, {
        $inc: { outstanding: -paymentReceived },
      });
    }

    await logActivity(req, {
      action: 'payment',
      entity: 'sale',
      entityId: sale._id,
      entityLabel: sale.invoiceNumber,
      description: `Recorded payment of ${amount} on sale ${sale.invoiceNumber}`,
      metadata: { amount, paymentMode },
    });

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: sale,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating payment',
      error: error.message,
    });
  }
};

// @desc    Cancel sale
// @route   PATCH /api/sales/:id/cancel
// @access  Public
const cancelSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }

    if (sale.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Sale is already cancelled',
      });
    }

    // Restore product quantities/status
    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      if (product) {
        if (product.imei) {
          await Product.findByIdAndUpdate(item.product, {
            status: 'available',
            soldDate: null,
          });
        } else {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { quantity: item.quantity },
          });
        }
      }
    }

    // Update customer stats
    if (sale.customer) {
      const dueAmount = sale.amount - sale.paid;
      await Customer.findByIdAndUpdate(sale.customer, {
        $inc: {
          totalPurchases: -sale.amount,
          outstanding: -dueAmount,
        },
      });
    }

    sale.status = 'cancelled';
    await sale.save();

    await logActivity(req, {
      action: 'cancel',
      entity: 'sale',
      entityId: sale._id,
      entityLabel: sale.invoiceNumber,
      description: `Cancelled sale ${sale.invoiceNumber}`,
    });

    res.status(200).json({
      success: true,
      message: 'Sale cancelled successfully',
      data: sale,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling sale',
      error: error.message,
    });
  }
};

// @desc    Get sales summary
// @route   GET /api/sales/summary
// @access  Public
const getSalesSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const baseQuery = { status: { $ne: 'cancelled' } };
    const matchQuery = { ...baseQuery };

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    // Get today's date range
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Get this month's date range
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Overall summary (with optional date filter)
    const summary = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$amount' },
          totalPaid: { $sum: '$paid' },
          totalDue: { $sum: { $subtract: ['$amount', '$paid'] } },
          count: { $sum: 1 },
          averageSale: { $avg: '$amount' },
        },
      },
    ]);

    // Today's sales
    const todaySummary = await Sale.aggregate([
      { 
        $match: { 
          ...baseQuery, 
          date: { $gte: todayStart, $lte: todayEnd } 
        } 
      },
      {
        $group: {
          _id: null,
          todaySales: { $sum: '$amount' },
          todayCount: { $sum: 1 },
        },
      },
    ]);

    // This month's sales
    const monthSummary = await Sale.aggregate([
      { 
        $match: { 
          ...baseQuery, 
          date: { $gte: monthStart } 
        } 
      },
      {
        $group: {
          _id: null,
          monthSales: { $sum: '$amount' },
          monthCount: { $sum: 1 },
        },
      },
    ]);

    const todayData = todaySummary[0] || { todaySales: 0, todayCount: 0 };
    const monthData = monthSummary[0] || { monthSales: 0, monthCount: 0 };

    // Calculate profit for filtered range (or this month when no filter)
    const profitQuery = startDate || endDate
      ? matchQuery
      : {
          ...baseQuery,
          date: { $gte: monthStart },
        };

    const monthSales = await Sale.find(profitQuery).populate('items.product', 'purchasePrice');

    let monthProfit = 0;
    for (const sale of monthSales) {
      for (const item of sale.items) {
        const purchasePrice = item.product?.purchasePrice || 0;
        const sellingPrice = item.price || 0;
        monthProfit += (sellingPrice - purchasePrice) * item.quantity;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...(summary[0] || {
          totalSales: 0,
          totalPaid: 0,
          totalDue: 0,
          count: 0,
          averageSale: 0,
        }),
        todaySales: todayData.todaySales,
        todayCount: todayData.todayCount,
        monthSales: monthData.monthSales,
        monthCount: monthData.monthCount,
        monthProfit,
        totalCount: summary[0]?.count || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sales summary',
      error: error.message,
    });
  }
};

// @desc    Get receivables (unpaid sales)
// @route   GET /api/sales/receivables
// @access  Public
const getReceivables = async (req, res) => {
  try {
    const { sortBy = 'date', sortOrder = 'desc' } = req.query;

    // Get sales with balance > 0 (unpaid or partially paid)
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const receivables = await Sale.find({
      balance: { $gt: 0 },
      status: { $nin: ['paid', 'cancelled'] },
    })
      .populate('customer', 'name phone')
      .sort(sort);

    // Calculate aging for each receivable
    const now = new Date();
    const receivablesWithAging = receivables.map((sale) => {
      const saleDate = new Date(sale.date);
      const daysDiff = Math.floor((now - saleDate) / (1000 * 60 * 60 * 24));
      
      let aging = '0-30 days';
      if (daysDiff > 60) {
        aging = '60+ days';
      } else if (daysDiff > 30) {
        aging = '30-60 days';
      }

      // Calculate due date (30 days from sale date)
      const dueDate = new Date(saleDate);
      dueDate.setDate(dueDate.getDate() + 30);

      return {
        _id: sale._id,
        customer: sale.customerName,
        customerId: sale.customer,
        invoice: sale.invoiceNumber,
        date: sale.date,
        amount: sale.amount,
        paid: sale.paid,
        due: sale.balance,
        dueDate: dueDate,
        aging,
        daysDiff,
      };
    });

    // Calculate summary
    const totalReceivables = receivablesWithAging.reduce((sum, r) => sum + r.due, 0);
    const aging0to30 = receivablesWithAging
      .filter((r) => r.aging === '0-30 days')
      .reduce((sum, r) => sum + r.due, 0);
    const aging30to60 = receivablesWithAging
      .filter((r) => r.aging === '30-60 days')
      .reduce((sum, r) => sum + r.due, 0);
    const aging60plus = receivablesWithAging
      .filter((r) => r.aging === '60+ days')
      .reduce((sum, r) => sum + r.due, 0);

    res.status(200).json({
      success: true,
      data: receivablesWithAging,
      summary: {
        totalReceivables,
        aging0to30,
        aging30to60,
        aging60plus,
        totalCustomers: receivablesWithAging.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching receivables',
      error: error.message,
    });
  }
};

// @desc    Get daily sales trend (last 7 days)
// @route   GET /api/sales/trend
// @access  Public
const getSalesTrend = async (req, res) => {
  try {
    const { days = 7, startDate, endDate } = req.query;

    const now = new Date();
    let startDateObj;
    let endDateObj;

    if (startDate || endDate) {
      startDateObj = startDate ? new Date(startDate) : new Date(now);
      startDateObj.setHours(0, 0, 0, 0);

      endDateObj = endDate ? new Date(endDate) : new Date(now);
      endDateObj.setHours(23, 59, 59, 999);
    } else {
      startDateObj = new Date(now);
      startDateObj.setDate(startDateObj.getDate() - parseInt(days) + 1);
      startDateObj.setHours(0, 0, 0, 0);
      endDateObj = now;
    }

    // Aggregate daily sales
    const dailySales = await Sale.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          date: { $gte: startDateObj, $lte: endDateObj },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' },
          },
          sales: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);

    // Create array for all days (including days with no sales)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];

    const totalDays =
      Math.floor((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDateObj);
      date.setDate(startDateObj.getDate() + i);

      const dayData = dailySales.find(
        (d) =>
          d._id.year === date.getFullYear() &&
          d._id.month === date.getMonth() + 1 &&
          d._id.day === date.getDate()
      );

      result.push({
        name: dayNames[date.getDay()],
        date: date.toISOString().split('T')[0],
        sales: dayData?.sales || 0,
        count: dayData?.count || 0,
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sales trend',
      error: error.message,
    });
  }
};

// @desc    Delete sale and restore product status
// @route   DELETE /api/sales/:id
// @access  Public
const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }

    // Restore product quantities/status (only if sale was not already cancelled)
    if (sale.status !== 'cancelled') {
      for (const item of sale.items) {
        const product = await Product.findById(item.product);
        if (product) {
          if (product.imei) {
            // Restore IMEI product to available and clear selling price
            await Product.findByIdAndUpdate(item.product, {
              status: 'available',
              soldDate: null,
              sellingPrice: null,
            });
          } else {
            // Restore quantity and clear selling price
            await Product.findByIdAndUpdate(item.product, {
              $inc: { quantity: item.quantity },
              sellingPrice: null,
            });
          }
        }
      }

      // Reverse customer stats
      if (sale.customer) {
        const dueAmount = sale.amount - sale.paid;
        await Customer.findByIdAndUpdate(sale.customer, {
          $inc: {
            totalPurchases: -sale.amount,
            outstanding: -dueAmount,
          },
        });
      }
    }

    // Delete the sale from database
    await Sale.findByIdAndDelete(req.params.id);

    await logActivity(req, {
      action: 'delete',
      entity: 'sale',
      entityId: sale._id,
      entityLabel: sale.invoiceNumber,
      description: `Deleted sale ${sale.invoiceNumber}`,
    });

    res.status(200).json({
      success: true,
      message: 'Sale deleted and products restored successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting sale',
      error: error.message,
    });
  }
};

module.exports = {
  getSales,
  getSale,
  createSale,
  updatePayment,
  cancelSale,
  deleteSale,
  getSalesSummary,
  getReceivables,
  getSalesTrend,
};
