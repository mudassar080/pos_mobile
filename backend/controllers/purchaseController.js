const Purchase = require('../models/Purchase');
const PurchaseReturn = require('../models/PurchaseReturn');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

const normalizeImei = (value) =>
  value == null || String(value).trim() === '' ? '' : String(value).trim();

/** Reverse stock/supplier effects of a recorded purchase (mirrors cancel). */
async function revertPurchaseInventoryAndSupplier(purchase) {
  for (const item of purchase.items) {
    const product = await Product.findById(item.product);
    if (product) {
      if (item.imei) {
        await Product.findByIdAndUpdate(item.product, {
          status: 'returned',
        });
      } else {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: -item.quantity },
        });
      }
    }
  }
  await Supplier.findByIdAndUpdate(purchase.supplier, {
    $inc: {
      totalPurchases: -purchase.amount,
      outstanding: -purchase.balance,
    },
  });
}

async function applyPreparedItemsToInventory(preparedItems, supplierId) {
  for (const item of preparedItems) {
    const product = await Product.findById(item.product);
    if (item.imei) {
      const productImei = normalizeImei(product.imei);
      const incomingImei = normalizeImei(item.imei);

      if (!incomingImei) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: item.quantity },
          purchasePrice: item.price,
          lastPurchasePrice: item.price,
          purchaseDate: new Date(),
          supplier: supplierId,
        });
      } else if (productImei === incomingImei) {
        await Product.findByIdAndUpdate(item.product, {
          status: 'available',
          purchasePrice: item.price,
          lastPurchasePrice: item.price,
          purchaseDate: new Date(),
          supplier: supplierId,
        });
      } else if (!productImei) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: item.quantity },
          imei: incomingImei,
          status: 'available',
          purchasePrice: item.price,
          lastPurchasePrice: item.price,
          purchaseDate: new Date(),
          supplier: supplierId,
        });
      } else {
        await Product.create({
          name: product.name,
          category: product.category,
          brand: product.brand,
          model: product.model,
          imei: incomingImei,
          color: product.color,
          purchasePrice: item.price,
          lastPurchasePrice: item.price,
          sellingPrice: product.sellingPrice,
          status: 'available',
          purchaseDate: new Date(),
          supplier: supplierId,
        });
      }
    } else {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: item.quantity },
        purchasePrice: item.price,
        lastPurchasePrice: item.price,
        purchaseDate: new Date(),
        supplier: supplierId,
      });
    }
  }
}

async function buildPreparedItems(items) {
  const preparedItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      const err = new Error(`Product not found: ${item.product}`);
      err.statusCode = 400;
      throw err;
    }

    const price = item.price || product.purchasePrice;
    const quantity = item.imei ? 1 : (item.quantity || 1);
    const itemTotal = price * quantity;

    preparedItems.push({
      product: product._id,
      productName: product.name,
      imei: item.imei || null,
      quantity,
      price,
      total: itemTotal,
    });

    totalAmount += itemTotal;
  }

  return { preparedItems, totalAmount };
}

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Public
const getPurchases = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      supplier,
      status,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
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

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const purchases = await Purchase.find(query)
      .populate('supplier', 'name phone')
      .populate('items.product', 'name category brand model purchasePrice lastPurchasePrice')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Purchase.countDocuments(query);

    res.status(200).json({
      success: true,
      data: purchases,
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
      message: 'Error fetching purchases',
      error: error.message,
    });
  }
};

// @desc    Get single purchase
// @route   GET /api/purchases/:id
// @access  Public
const getPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier', 'name phone email address')
      .populate('items.product', 'name category brand');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found',
      });
    }

    res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase',
      error: error.message,
    });
  }
};

// @desc    Create purchase
// @route   POST /api/purchases
// @access  Public
const createPurchase = async (req, res) => {
  try {
    const { items, supplier, paid, notes } = req.body;

    // Validate supplier
    const supplierDoc = await Supplier.findById(supplier);
    if (!supplierDoc) {
      return res.status(400).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    let preparedItems;
    let totalAmount;
    try {
      const built = await buildPreparedItems(items);
      preparedItems = built.preparedItems;
      totalAmount = built.totalAmount;
    } catch (e) {
      if (e.statusCode === 400) {
        return res.status(400).json({
          success: false,
          message: e.message,
        });
      }
      throw e;
    }

    // Determine status
    const paidAmount = paid || 0;
    let status = 'credit';
    if (paidAmount >= totalAmount) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partial';
    }

    const balance = totalAmount - paidAmount;

    // Create purchase
    const purchase = await Purchase.create({
      supplier,
      supplierName: supplierDoc.name,
      items: preparedItems,
      amount: totalAmount,
      paid: paidAmount,
      paymentHistory:
        paidAmount > 0
          ? [
              {
                amount: paidAmount,
                paymentMode: 'Cash',
                source: 'purchase-create',
                note: 'Initial payment at purchase creation',
                date: new Date(),
              },
            ]
          : [],
      balance,
      status,
      notes,
    });

    await applyPreparedItemsToInventory(preparedItems, supplier);

    // Update supplier payables: increase totalPurchases and outstanding (unpaid balance)
    await Supplier.findByIdAndUpdate(supplier, {
      $inc: {
        totalPurchases: totalAmount,
        outstanding: balance,
      },
      lastPurchase: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Purchase created successfully',
      data: purchase,
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
      message: 'Error creating purchase',
      error: error.message,
    });
  }
};

// @desc    Update purchase payment
// @route   PATCH /api/purchases/:id/payment
// @access  Public
const updatePayment = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment amount is required',
      });
    }

    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found',
      });
    }

    if (purchase.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Purchase is already fully paid',
      });
    }

    const previousBalance = purchase.balance;
    const paymentApplied = Math.min(amount, previousBalance);
    purchase.paid += amount;
    purchase.balance = purchase.amount - purchase.paid;

    if (purchase.paid >= purchase.amount) {
      purchase.status = 'paid';
      purchase.balance = 0;
    } else {
      purchase.status = 'partial';
    }

    if (paymentApplied > 0) {
      purchase.paymentHistory = purchase.paymentHistory || [];
      purchase.paymentHistory.push({
        amount: paymentApplied,
        paymentMode: 'Cash',
        source: 'purchase-update-payment',
        note: 'Additional payment made on purchase',
        date: new Date(),
      });
    }

    await purchase.save();

    // Update supplier outstanding
    const paymentMade = Math.min(amount, previousBalance);
    await Supplier.findByIdAndUpdate(purchase.supplier, {
      $inc: { outstanding: -paymentMade },
    });

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: purchase,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating payment',
      error: error.message,
    });
  }
};

// @desc    Cancel purchase
// @route   PATCH /api/purchases/:id/cancel
// @access  Public
const cancelPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found',
      });
    }

    if (purchase.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Purchase is already cancelled',
      });
    }

    await revertPurchaseInventoryAndSupplier(purchase);

    purchase.status = 'cancelled';
    await purchase.save();

    res.status(200).json({
      success: true,
      message: 'Purchase cancelled successfully',
      data: purchase,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling purchase',
      error: error.message,
    });
  }
};

// @desc    Update purchase (notes/date always; line items only if unpaid & no returns)
// @route   PUT /api/purchases/:id
// @access   Public
const updatePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found',
      });
    }

    if (purchase.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit a cancelled purchase',
      });
    }

    const { notes, date, supplier, items } = req.body;
    const lineEditRequested = supplier !== undefined || items !== undefined;

    if (!lineEditRequested) {
      if (notes !== undefined) purchase.notes = notes;
      if (date !== undefined) purchase.date = date;
      await purchase.save();
      const updated = await Purchase.findById(req.params.id)
        .populate('supplier', 'name phone email address')
        .populate('items.product', 'name category brand');
      return res.status(200).json({
        success: true,
        message: 'Purchase updated',
        data: updated,
      });
    }

    const returnCount = await PurchaseReturn.countDocuments({ purchase: req.params.id });

    if (returnCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot change supplier or line items while this purchase has returns. You can still update notes only.',
      });
    }

    if (purchase.paid > 0) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot change supplier or line items while this purchase has payments. You can still update notes only.',
      });
    }

    if (!supplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier is required when updating line items',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one line item is required',
      });
    }

    const supplierDoc = await Supplier.findById(supplier);
    if (!supplierDoc) {
      return res.status(400).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    let preparedItems;
    let totalAmount;
    try {
      const built = await buildPreparedItems(items);
      preparedItems = built.preparedItems;
      totalAmount = built.totalAmount;
    } catch (e) {
      if (e.statusCode === 400) {
        return res.status(400).json({
          success: false,
          message: e.message,
        });
      }
      throw e;
    }

    await revertPurchaseInventoryAndSupplier(purchase);

    const paidAmount = 0;
    const balance = totalAmount - paidAmount;

    purchase.supplier = supplier;
    purchase.supplierName = supplierDoc.name;
    purchase.items = preparedItems;
    purchase.amount = totalAmount;
    purchase.paid = paidAmount;
    purchase.paymentHistory = [];
    purchase.balance = balance;
    purchase.status = 'credit';
    if (notes !== undefined) purchase.notes = notes;
    if (date !== undefined) purchase.date = date;

    await purchase.save();

    await applyPreparedItemsToInventory(preparedItems, supplier);

    await Supplier.findByIdAndUpdate(supplier, {
      $inc: {
        totalPurchases: totalAmount,
        outstanding: balance,
      },
      lastPurchase: new Date(),
    });

    const updated = await Purchase.findById(req.params.id)
      .populate('supplier', 'name phone email address')
      .populate('items.product', 'name category brand');

    res.status(200).json({
      success: true,
      message: 'Purchase updated',
      data: updated,
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
      message: 'Error updating purchase',
      error: error.message,
    });
  }
};

// @desc    Delete purchase (reverses stock/supplier if not already cancelled)
// @route   DELETE /api/purchases/:id
// @access   Public
const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found',
      });
    }

    const returnCount = await PurchaseReturn.countDocuments({ purchase: req.params.id });
    if (returnCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot delete a purchase that has linked returns. Remove or adjust those returns first.',
      });
    }

    if (purchase.status !== 'cancelled') {
      await revertPurchaseInventoryAndSupplier(purchase);
    }

    await Purchase.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Purchase deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting purchase',
      error: error.message,
    });
  }
};

// @desc    Get purchase summary
// @route   GET /api/purchases/summary
// @access  Public
const getPurchaseSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const baseQuery = { status: { $ne: 'cancelled' } };
    const matchQuery = { ...baseQuery };

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    // Get this month's date range
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Overall summary (with optional date filter)
    const summary = await Purchase.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: '$amount' },
          totalPaid: { $sum: '$paid' },
          totalBalance: { $sum: '$balance' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Today's date range
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Today's purchases
    const todaySummary = await Purchase.aggregate([
      {
        $match: {
          ...baseQuery,
          date: { $gte: todayStart, $lt: todayEnd },
        },
      },
      {
        $group: {
          _id: null,
          todayPurchases: { $sum: '$amount' },
          todayCount: { $sum: 1 },
        },
      },
    ]);

    // This month's purchases
    const monthSummary = await Purchase.aggregate([
      {
        $match: {
          ...baseQuery,
          date: { $gte: monthStart },
        },
      },
      {
        $group: {
          _id: null,
          monthPurchases: { $sum: '$amount' },
          monthCount: { $sum: 1 },
        },
      },
    ]);

    const todayData = todaySummary[0] || { todayPurchases: 0, todayCount: 0 };
    const monthData = monthSummary[0] || { monthPurchases: 0, monthCount: 0 };

    res.status(200).json({
      success: true,
      data: {
        ...(summary[0] || {
          totalPurchases: 0,
          totalPaid: 0,
          totalBalance: 0,
          count: 0,
        }),
        todayPurchases: todayData.todayPurchases,
        todayCount: todayData.todayCount,
        monthPurchases: monthData.monthPurchases,
        monthCount: monthData.monthCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase summary',
      error: error.message,
    });
  }
};

// @desc    Get payables (unpaid purchases)
// @route   GET /api/purchases/payables
// @access  Public
const getPayables = async (req, res) => {
  try {
    const { sortBy = 'date', sortOrder = 'desc' } = req.query;

    // Get purchases with balance > 0 (unpaid or partially paid)
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const payables = await Purchase.find({
      balance: { $gt: 0 },
      status: { $nin: ['paid', 'cancelled'] },
    })
      .populate('supplier', 'name phone')
      .sort(sort);

    // Calculate aging for each payable
    const now = new Date();
    const payablesWithAging = payables.map((purchase) => {
      const purchaseDate = new Date(purchase.date);
      const daysDiff = Math.floor((now - purchaseDate) / (1000 * 60 * 60 * 24));
      
      let aging = '0-30 days';
      if (daysDiff > 60) {
        aging = '60+ days';
      } else if (daysDiff > 30) {
        aging = '30-60 days';
      }

      // Calculate due date (30 days from purchase date)
      const dueDate = new Date(purchaseDate);
      dueDate.setDate(dueDate.getDate() + 30);

      return {
        _id: purchase._id,
        supplier: purchase.supplierName,
        supplierId: purchase.supplier,
        purchase: purchase.purchaseNumber,
        date: purchase.date,
        amount: purchase.amount,
        paid: purchase.paid,
        due: purchase.balance,
        dueDate: dueDate,
        aging,
        daysDiff,
      };
    });

    // Calculate summary
    const totalPayables = payablesWithAging.reduce((sum, p) => sum + p.due, 0);
    const totalPurchased = payablesWithAging.reduce((sum, p) => sum + p.amount, 0);
    const aging0to30 = payablesWithAging
      .filter((p) => p.aging === '0-30 days')
      .reduce((sum, p) => sum + p.due, 0);
    const aging30to60 = payablesWithAging
      .filter((p) => p.aging === '30-60 days')
      .reduce((sum, p) => sum + p.due, 0);
    const aging60plus = payablesWithAging
      .filter((p) => p.aging === '60+ days')
      .reduce((sum, p) => sum + p.due, 0);

    res.status(200).json({
      success: true,
      data: payablesWithAging,
      summary: {
        totalPayables,
        totalPurchased,
        aging0to30,
        aging30to60,
        aging60plus,
        totalSuppliers: payablesWithAging.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payables',
      error: error.message,
    });
  }
};

module.exports = {
  getPurchases,
  getPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase,
  updatePayment,
  cancelPurchase,
  getPurchaseSummary,
  getPayables,
};
