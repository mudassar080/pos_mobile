const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const Purchase = require('../models/Purchase');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Public
const getSuppliers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      hasOutstanding,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (hasOutstanding === 'true') {
      query.outstanding = { $gt: 0 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const suppliers = await Supplier.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('linkedCustomer', 'name phone outstanding');

    const total = await Supplier.countDocuments(query);

    res.status(200).json({
      success: true,
      data: suppliers,
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
      message: 'Error fetching suppliers',
      error: error.message,
    });
  }
};

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Public
const getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id)
      .populate('linkedCustomer', 'name phone outstanding totalPurchases');

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    // Calculate net balance if linked
    let netBalance = null;
    if (supplier.linkedCustomer) {
      const payable = supplier.outstanding;
      const receivable = supplier.linkedCustomer.outstanding;
      netBalance = {
        payable,
        receivable,
        net: payable - receivable,
        description:
          payable - receivable > 0
            ? `You owe them ${payable - receivable}`
            : payable - receivable < 0
            ? `They owe you ${Math.abs(payable - receivable)}`
            : 'Settled',
      };
    }

    res.status(200).json({
      success: true,
      data: supplier,
      netBalance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching supplier',
      error: error.message,
    });
  }
};

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Public
const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);

    // If linkedCustomer is provided, also link back from customer
    if (req.body.linkedCustomer) {
      await Customer.findByIdAndUpdate(req.body.linkedCustomer, {
        linkedSupplier: supplier._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier,
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
      message: 'Error creating supplier',
      error: error.message,
    });
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Public
const updateSupplier = async (req, res) => {
  try {
    // Get the old supplier to check if link changed
    const oldSupplier = await Supplier.findById(req.params.id);

    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    // Handle link changes
    if (oldSupplier) {
      const oldLink = oldSupplier.linkedCustomer?.toString();
      const newLink = req.body.linkedCustomer || null;

      // Unlink old customer
      if (oldLink && oldLink !== newLink) {
        await Customer.findByIdAndUpdate(oldLink, { linkedSupplier: null });
      }
      // Link new customer
      if (newLink && newLink !== oldLink) {
        // Unlink any existing supplier from the target customer
        await Customer.findOneAndUpdate(
          { linkedSupplier: supplier._id },
          { linkedSupplier: null }
        );
        await Customer.findByIdAndUpdate(newLink, { linkedSupplier: supplier._id });
      }
      // If link removed
      if (!newLink && oldLink) {
        await Customer.findByIdAndUpdate(oldLink, { linkedSupplier: null });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier,
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
      message: 'Error updating supplier',
      error: error.message,
    });
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Public
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    // Unlink customer if linked
    if (supplier.linkedCustomer) {
      await Customer.findByIdAndUpdate(supplier.linkedCustomer, { linkedSupplier: null });
    }

    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully',
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting supplier',
      error: error.message,
    });
  }
};

// @desc    Make payment to supplier
// @route   PATCH /api/suppliers/:id/payment
// @access  Public
const makePayment = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment amount is required',
      });
    }

    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    if (supplier.outstanding <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Supplier has no outstanding balance',
      });
    }

    const paymentMade = Math.min(amount, supplier.outstanding);
    supplier.outstanding -= paymentMade;
    await supplier.save();

    // Also update the underlying purchase records (oldest unpaid first)
    let remaining = paymentMade;
    const updatedPurchases = [];

    const unpaidPurchases = await Purchase.find({
      supplier: supplier._id,
      status: { $in: ['credit', 'partial'] },
    }).sort({ date: 1, createdAt: 1 });

    for (const purchase of unpaidPurchases) {
      if (remaining <= 0) break;

      const purchaseBalance = purchase.amount - purchase.paid;
      if (purchaseBalance <= 0) continue;

      const applyAmount = Math.min(remaining, purchaseBalance);
      purchase.paid += applyAmount;
      purchase.balance = purchase.amount - purchase.paid;

      if (purchase.balance <= 0) {
        purchase.status = 'paid';
      } else {
        purchase.status = 'partial';
      }

      purchase.paymentHistory = purchase.paymentHistory || [];
      purchase.paymentHistory.push({
        amount: applyAmount,
        paymentMode: 'Cash',
        source: 'supplier-payment',
        note: `Paid to supplier account (${supplier.name})`,
        date: new Date(),
      });

      await purchase.save();
      remaining -= applyAmount;

      updatedPurchases.push({
        purchaseNumber: purchase.purchaseNumber,
        applied: applyAmount,
        newPaid: purchase.paid,
        newBalance: purchase.balance,
        status: purchase.status,
      });
    }

    res.status(200).json({
      success: true,
      message: `Payment of ${paymentMade} made successfully. ${updatedPurchases.length} purchase(s) updated.`,
      data: supplier,
      updatedPurchases,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error making payment',
      error: error.message,
    });
  }
};

// @desc    Get suppliers summary (payables)
// @route   GET /api/suppliers/summary
// @access  Public
const getSuppliersSummary = async (req, res) => {
  try {
    const summary = await Supplier.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalSuppliers: { $sum: 1 },
          totalPayables: { $sum: '$outstanding' },
          suppliersWithCredit: {
            $sum: { $cond: [{ $gt: ['$outstanding', 0] }, 1, 0] },
          },
          totalPurchaseValue: { $sum: '$totalPurchases' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: summary[0] || {
        totalSuppliers: 0,
        totalPayables: 0,
        suppliersWithCredit: 0,
        totalPurchaseValue: 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching suppliers summary',
      error: error.message,
    });
  }
};

// @desc    Link a supplier to a customer (same person)
// @route   PATCH /api/suppliers/:id/link-customer
// @access  Public
const linkCustomer = async (req, res) => {
  try {
    const { customerId } = req.body;
    const supplierId = req.params.id;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    if (!customerId) {
      // Unlink
      if (supplier.linkedCustomer) {
        await Customer.findByIdAndUpdate(supplier.linkedCustomer, { linkedSupplier: null });
      }
      supplier.linkedCustomer = null;
      await supplier.save();

      return res.status(200).json({
        success: true,
        message: 'Supplier unlinked from customer',
        data: supplier,
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Check if customer is already linked to another supplier
    if (customer.linkedSupplier && customer.linkedSupplier.toString() !== supplierId) {
      return res.status(400).json({
        success: false,
        message: `Customer is already linked to another supplier`,
      });
    }

    // Unlink previous customer if any
    if (supplier.linkedCustomer && supplier.linkedCustomer.toString() !== customerId) {
      await Customer.findByIdAndUpdate(supplier.linkedCustomer, { linkedSupplier: null });
    }

    supplier.linkedCustomer = customerId;
    await supplier.save();

    customer.linkedSupplier = supplierId;
    await customer.save();

    res.status(200).json({
      success: true,
      message: `Supplier linked to customer: ${customer.name}`,
      data: supplier,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error linking supplier to customer',
      error: error.message,
    });
  }
};

// @desc    Settle balance between linked supplier and customer
// @route   POST /api/suppliers/:id/settle
// @access  Public
const settleLinkedBalance = async (req, res) => {
  try {
    const supplierId = req.params.id;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    if (!supplier.linkedCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Supplier is not linked to any customer',
      });
    }

    const customer = await Customer.findById(supplier.linkedCustomer);
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: 'Linked customer not found',
      });
    }

    const payable = supplier.outstanding;
    const receivable = customer.outstanding;

    if (payable === 0 && receivable === 0) {
      return res.status(400).json({
        success: false,
        message: 'Both balances are zero. Nothing to settle.',
      });
    }

    // Settlement scenarios:
    // 1. payable > 0 && receivable > 0: Net off the overlapping amount
    //    settleAmount = min(payable, receivable)
    //    supplier.outstanding -= settleAmount, customer.outstanding -= settleAmount
    // 2. payable < 0 (supplier owes us): Transfer as receivable to customer
    //    customer.outstanding += |payable|, supplier.outstanding = 0
    // 3. receivable < 0 (we owe customer): Transfer as payable to supplier
    //    supplier.outstanding += |receivable|, customer.outstanding = 0

    let settleAmount = 0;
    let description = '';

    if (payable > 0 && receivable > 0) {
      settleAmount = Math.min(payable, receivable);
      supplier.outstanding -= settleAmount;
      customer.outstanding -= settleAmount;
      description = `Netted off ${settleAmount}. Supplier payable: ${supplier.outstanding}, Customer receivable: ${customer.outstanding}`;
    } else if (payable < 0) {
      settleAmount = Math.abs(payable);
      supplier.outstanding = 0;
      customer.outstanding += settleAmount;
      description = `Transferred ${settleAmount} from supplier credit to customer receivable. Customer now owes: ${customer.outstanding}`;
    } else if (receivable < 0) {
      settleAmount = Math.abs(receivable);
      customer.outstanding = 0;
      supplier.outstanding += settleAmount;
      description = `Transferred ${settleAmount} from customer credit to supplier payable. Supplier payable: ${supplier.outstanding}`;
    } else {
      return res.status(400).json({
        success: false,
        message: 'No balance to settle.',
      });
    }

    await supplier.save();
    await customer.save();

    res.status(200).json({
      success: true,
      message: description,
      data: {
        settledAmount: settleAmount,
        supplierOutstanding: supplier.outstanding,
        customerOutstanding: customer.outstanding,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error settling balance',
      error: error.message,
    });
  }
};

module.exports = {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  makePayment,
  getSuppliersSummary,
  linkCustomer,
  settleLinkedBalance,
};
