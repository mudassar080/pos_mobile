const OtherIncome = require('../models/OtherIncome');

// @desc    Get all other income
// @route   GET /api/other-income
// @access  Public
const getOtherIncomes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const incomes = await OtherIncome.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await OtherIncome.countDocuments(query);

    res.status(200).json({
      success: true,
      data: incomes,
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
      message: 'Error fetching other income',
      error: error.message,
    });
  }
};

// @desc    Get single other income
// @route   GET /api/other-income/:id
// @access  Public
const getOtherIncome = async (req, res) => {
  try {
    const income = await OtherIncome.findById(req.params.id);

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Other income not found',
      });
    }

    res.status(200).json({
      success: true,
      data: income,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching other income',
      error: error.message,
    });
  }
};

// @desc    Create other income
// @route   POST /api/other-income
// @access  Public
const createOtherIncome = async (req, res) => {
  try {
    const income = await OtherIncome.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Other income created successfully',
      data: income,
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
      message: 'Error creating other income',
      error: error.message,
    });
  }
};

// @desc    Update other income
// @route   PUT /api/other-income/:id
// @access  Public
const updateOtherIncome = async (req, res) => {
  try {
    const income = await OtherIncome.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Other income not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Other income updated successfully',
      data: income,
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
      message: 'Error updating other income',
      error: error.message,
    });
  }
};

// @desc    Delete other income
// @route   DELETE /api/other-income/:id
// @access  Public
const deleteOtherIncome = async (req, res) => {
  try {
    const income = await OtherIncome.findByIdAndDelete(req.params.id);

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Other income not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Other income deleted successfully',
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting other income',
      error: error.message,
    });
  }
};

// @desc    Get other income summary
// @route   GET /api/other-income/summary
// @access  Public
const getOtherIncomeSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = {};

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const summary = await OtherIncome.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const totalIncome = summary.reduce((sum, cat) => sum + cat.total, 0);

    // Today's other income
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todaySummary = await OtherIncome.aggregate([
      { $match: { date: { $gte: todayStart, $lt: todayEnd } } },
      {
        $group: {
          _id: null,
          todayIncome: { $sum: '$amount' },
          todayCount: { $sum: 1 },
        },
      },
    ]);

    const todayData = todaySummary[0] || { todayIncome: 0, todayCount: 0 };

    res.status(200).json({
      success: true,
      data: {
        byCategory: summary,
        totalIncome,
        totalCount: summary.reduce((sum, cat) => sum + cat.count, 0),
        todayIncome: todayData.todayIncome,
        todayCount: todayData.todayCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching other income summary',
      error: error.message,
    });
  }
};

module.exports = {
  getOtherIncomes,
  getOtherIncome,
  createOtherIncome,
  updateOtherIncome,
  deleteOtherIncome,
  getOtherIncomeSummary,
};
