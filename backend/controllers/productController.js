const Product = require('../models/Product');
const logActivity = require('../utils/logActivity');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      type,
      status,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { imei: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
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
      message: 'Error fetching products',
      error: error.message,
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message,
    });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Public
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    await logActivity(req, {
      action: 'create',
      entity: 'product',
      entityId: product._id,
      entityLabel: product.name,
      description: `Added product "${product.name}"`,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this IMEI already exists',
        error: error.message,
      });
    }

    // Handle validation errors
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
      message: 'Error creating product',
      error: error.message,
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Public
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await logActivity(req, {
      action: 'update',
      entity: 'product',
      entityId: product._id,
      entityLabel: product.name,
      description: `Updated product "${product.name}"`,
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this IMEI already exists',
        error: error.message,
      });
    }

    // Handle validation errors
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
      message: 'Error updating product',
      error: error.message,
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Public
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await logActivity(req, {
      action: 'delete',
      entity: 'product',
      entityId: product._id,
      entityLabel: product.name,
      description: `Deleted product "${product.name}"`,
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message,
    });
  }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Public
const getLowStockProducts = async (req, res) => {
  try {
    const { threshold = 5, startDate, endDate } = req.query;
    const dateMatch = {};

    if (startDate || endDate) {
      dateMatch.purchaseDate = {};
      if (startDate) dateMatch.purchaseDate.$gte = new Date(startDate);
      if (endDate) dateMatch.purchaseDate.$lte = new Date(endDate);
    }
    
    // For non-IMEI products, check quantity vs threshold
    const accessoryLowStock = await Product.find({
      imei: { $in: [null, ''] },
      isActive: true,
      ...dateMatch,
      quantity: { $lt: parseInt(threshold) },
    }).sort({ quantity: 1 });

    res.status(200).json({
      success: true,
      count: accessoryLowStock.length,
      data: accessoryLowStock,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock products',
      error: error.message,
    });
  }
};

// @desc    Update product stock
// @route   PATCH /api/products/:id/stock
// @access  Public
const updateStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body;

    if (quantity === undefined || !operation) {
      return res.status(400).json({
        success: false,
        message: 'Quantity and operation are required',
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (operation === 'add') {
      product.quantity += quantity;
    } else if (operation === 'subtract') {
      if (product.quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock',
        });
      }
      product.quantity -= quantity;
    } else if (operation === 'set') {
      product.quantity = quantity;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Use add, subtract, or set',
      });
    }

    await product.save();

    await logActivity(req, {
      action: 'stock_update',
      entity: 'product',
      entityId: product._id,
      entityLabel: product.name,
      description: `Stock ${operation}: ${quantity} for "${product.name}" (now ${product.quantity})`,
      metadata: { operation, quantity, newQuantity: product.quantity },
    });

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating stock',
      error: error.message,
    });
  }
};

// @desc    Get stock summary (phones and accessories)
// @route   GET /api/products/stock-summary
// @access  Public
const getStockSummary = async (req, res) => {
  try {
    const { threshold = 5, startDate, endDate } = req.query;
    const dateMatch = {};

    if (startDate || endDate) {
      dateMatch.purchaseDate = {};
      if (startDate) dateMatch.purchaseDate.$gte = new Date(startDate);
      if (endDate) dateMatch.purchaseDate.$lte = new Date(endDate);
    }
    
    // IMEI-based stock summary with value (purchase + selling)
    const phoneSummary = await Product.aggregate([
      { $match: { imei: { $nin: [null, ''] }, ...dateMatch } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          value: { $sum: '$purchasePrice' },
          sellingValue: {
            $sum: { $ifNull: ['$sellingPrice', '$purchasePrice'] },
          },
        },
      },
    ]);

    // Available phones value
    const phoneAvailable = phoneSummary.find((s) => s._id === 'available') || { count: 0, value: 0, sellingValue: 0 };

    // Non-IMEI stock summary with value (purchase + selling)
    const accessorySummary = await Product.aggregate([
      { $match: { $or: [{ imei: null }, { imei: '' }], isActive: true, ...dateMatch } },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          totalProducts: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } },
          totalSellingValue: {
            $sum: {
              $multiply: [
                '$quantity',
                { $ifNull: ['$sellingPrice', '$purchasePrice'] },
              ],
            },
          },
          lowStockCount: {
            $sum: {
              $cond: [{ $lt: ['$quantity', parseInt(threshold)] }, 1, 0],
            },
          },
        },
      },
    ]);

    const accessoryData = accessorySummary[0] || {
      totalQuantity: 0,
      totalProducts: 0,
      totalValue: 0,
      totalSellingValue: 0,
      lowStockCount: 0,
    };

    // Calculate total stock value (available phones + accessories)
    const totalStockValue = phoneAvailable.value + accessoryData.totalValue;
    const totalSellingValue = phoneAvailable.sellingValue + accessoryData.totalSellingValue;

    res.status(200).json({
      success: true,
      data: {
        phones: {
          available: phoneAvailable.count,
          sold: phoneSummary.find((s) => s._id === 'sold')?.count || 0,
          returned: phoneSummary.find((s) => s._id === 'returned')?.count || 0,
          damaged: phoneSummary.find((s) => s._id === 'damaged')?.count || 0,
          value: phoneAvailable.value,
          sellingValue: phoneAvailable.sellingValue,
        },
        accessories: {
          ...accessoryData,
          value: accessoryData.totalValue,
          sellingValue: accessoryData.totalSellingValue,
        },
        totalValue: totalStockValue,
        totalSellingValue,
        totalItems: phoneAvailable.count + accessoryData.totalQuantity,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stock summary',
      error: error.message,
    });
  }
};

// @desc    Get all categories
// @route   GET /api/products/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message,
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  updateStock,
  getStockSummary,
  getCategories,
};
