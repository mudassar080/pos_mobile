const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Sale = require('../models/Sale');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Public
const getCustomers = async (req, res) => {
  try {
    const paging = parsePagination(req, res);
    if (!paging) return;

    const { page, limit, skip } = paging;
    const {
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

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const customers = await Customer.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('linkedSupplier', 'name phone outstanding');

    const total = await Customer.countDocuments(query);

    res.status(200).json({
      success: true,
      data: customers,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message,
    });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Public
const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('linkedSupplier', 'name phone outstanding totalPurchases');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    let netBalance = null;
    if (customer.linkedSupplier) {
      const receivable = customer.outstanding;
      const payable = customer.linkedSupplier.outstanding;
      netBalance = {
        receivable,
        payable,
        net: receivable - payable,
        description:
          receivable - payable > 0
            ? `They owe you ${receivable - payable}`
            : receivable - payable < 0
            ? `You owe them ${Math.abs(receivable - payable)}`
            : 'Settled',
      };
    }

    res.status(200).json({
      success: true,
      data: customer,
      netBalance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message,
    });
  }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Public
const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);

    if (req.body.linkedSupplier) {
      await Supplier.findByIdAndUpdate(req.body.linkedSupplier, {
        linkedCustomer: customer._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
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
      message: 'Error creating customer',
      error: error.message,
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Public
const updateCustomer = async (req, res) => {
  try {
    const oldCustomer = await Customer.findById(req.params.id);

    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Handle link changes
    if (oldCustomer) {
      const oldLink = oldCustomer.linkedSupplier?.toString();
      const newLink = req.body.linkedSupplier || null;

      if (oldLink && oldLink !== newLink) {
        await Supplier.findByIdAndUpdate(oldLink, { linkedCustomer: null });
      }
      if (newLink && newLink !== oldLink) {
        await Supplier.findOneAndUpdate(
          { linkedCustomer: customer._id },
          { linkedCustomer: null }
        );
        await Supplier.findByIdAndUpdate(newLink, { linkedCustomer: customer._id });
      }
      if (!newLink && oldLink) {
        await Supplier.findByIdAndUpdate(oldLink, { linkedCustomer: null });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
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
      message: 'Error updating customer',
      error: error.message,
    });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Public
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    if (customer.linkedSupplier) {
      await Supplier.findByIdAndUpdate(customer.linkedSupplier, { linkedCustomer: null });
    }

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting customer',
      error: error.message,
    });
  }
};

// @desc    Receive payment from customer
// @route   PATCH /api/customers/:id/payment
// @access  Public
const receivePayment = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment amount is required',
      });
    }

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    if (customer.outstanding <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer has no outstanding balance',
      });
    }

    const paymentReceived = Math.min(amount, customer.outstanding);
    customer.outstanding -= paymentReceived;
    await customer.save();

    // Also update the underlying sale records (oldest unpaid first)
    let remaining = paymentReceived;
    const updatedSales = [];

    const unpaidSales = await Sale.find({
      customer: customer._id,
      status: { $in: ['credit', 'partial'] },
    }).sort({ date: 1, createdAt: 1 });

    for (const sale of unpaidSales) {
      if (remaining <= 0) break;

      const saleBalance = sale.amount - sale.paid;
      if (saleBalance <= 0) continue;

      const applyAmount = Math.min(remaining, saleBalance);
      sale.paid += applyAmount;

      if (sale.paid >= sale.amount) {
        sale.status = 'paid';
      } else {
        sale.status = 'partial';
      }

      sale.paymentHistory = sale.paymentHistory || [];
      sale.paymentHistory.push({
        amount: applyAmount,
        paymentMode: 'Cash',
        source: 'customer-receipt',
        note: `Received from customer account (${customer.name})`,
        date: new Date(),
      });

      await sale.save();
      remaining -= applyAmount;

      updatedSales.push({
        invoiceNumber: sale.invoiceNumber,
        applied: applyAmount,
        newPaid: sale.paid,
        newBalance: sale.amount - sale.paid,
        status: sale.status,
      });
    }

    res.status(200).json({
      success: true,
      message: `Payment of ${paymentReceived} received. ${updatedSales.length} sale(s) updated.`,
      data: customer,
      updatedSales,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error receiving payment',
      error: error.message,
    });
  }
};

// @desc    Get customers summary (receivables) including walk-in customers
// @route   GET /api/customers/summary
// @access  Public
const getCustomersSummary = async (req, res) => {
  try {
    // For linked customer/supplier pairs, compute net receivable so dashboard reflects
    // balance changes caused by purchase-side activity (e.g. purchase returns).
    const customers = await Customer.find({ isActive: true })
      .select('outstanding totalPurchases linkedSupplier')
      .populate('linkedSupplier', 'outstanding');

    let totalReceivables = 0;
    let customersWithCredit = 0;
    let totalSalesValue = 0;

    for (const customer of customers) {
      const customerOutstanding = customer.outstanding || 0;
      const supplierOutstanding = customer.linkedSupplier?.outstanding || 0;
      const netReceivable = customerOutstanding - supplierOutstanding;
      const receivableContribution = netReceivable > 0 ? netReceivable : 0;

      totalReceivables += receivableContribution;
      totalSalesValue += customer.totalPurchases || 0;
      if (receivableContribution > 0) {
        customersWithCredit += 1;
      }
    }

    const walkInSummary = await Sale.aggregate([
      {
        $match: {
          customer: null,
          status: { $in: ['partial', 'credit'] },
        },
      },
      {
        $group: {
          _id: null,
          walkInReceivables: { $sum: { $subtract: ['$amount', '$paid'] } },
          walkInCount: { $sum: 1 },
        },
      },
    ]);

    const walkIn = walkInSummary[0] || { walkInReceivables: 0, walkInCount: 0 };

    res.status(200).json({
      success: true,
      data: {
        totalCustomers: customers.length,
        totalReceivables: totalReceivables + walkIn.walkInReceivables,
        customersWithCredit: customersWithCredit + (walkIn.walkInCount > 0 ? 1 : 0),
        totalSalesValue,
        walkInReceivables: walkIn.walkInReceivables,
        walkInCount: walkIn.walkInCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customers summary',
      error: error.message,
    });
  }
};

// @desc    Link a customer to a supplier (same person)
// @route   PATCH /api/customers/:id/link-supplier
// @access  Public
const linkSupplier = async (req, res) => {
  try {
    const { supplierId } = req.body;
    const customerId = req.params.id;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (!supplierId) {
      if (customer.linkedSupplier) {
        await Supplier.findByIdAndUpdate(customer.linkedSupplier, { linkedCustomer: null });
      }
      customer.linkedSupplier = null;
      await customer.save();

      return res.status(200).json({
        success: true,
        message: 'Customer unlinked from supplier',
        data: customer,
      });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    if (supplier.linkedCustomer && supplier.linkedCustomer.toString() !== customerId) {
      return res.status(400).json({
        success: false,
        message: `Supplier is already linked to another customer`,
      });
    }

    if (customer.linkedSupplier && customer.linkedSupplier.toString() !== supplierId) {
      await Supplier.findByIdAndUpdate(customer.linkedSupplier, { linkedCustomer: null });
    }

    customer.linkedSupplier = supplierId;
    await customer.save();

    supplier.linkedCustomer = customerId;
    await supplier.save();

    res.status(200).json({
      success: true,
      message: `Customer linked to supplier: ${supplier.name}`,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error linking customer to supplier',
      error: error.message,
    });
  }
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  receivePayment,
  getCustomersSummary,
  linkSupplier,
};
