const Investment = require('../models/Investment');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

// @desc    Get all investments
// @route   GET /api/investments
// @access  Public
const getInvestments = async (req, res) => {
  try {
    const paging = parsePagination(req, res);
    if (!paging) return;

    const { page, limit, skip } = paging;
    const {
      type,
      owner,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (type) {
      query.type = type;
    }

    if (owner) {
      query.owner = owner;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const investments = await Investment.find(query)
      .populate('owner', 'name phone')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Investment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: investments,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching investments',
      error: error.message,
    });
  }
};

// @desc    Get single investment
// @route   GET /api/investments/:id
// @access  Public
const getInvestment = async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found',
      });
    }

    res.status(200).json({
      success: true,
      data: investment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching investment',
      error: error.message,
    });
  }
};

// @desc    Create investment
// @route   POST /api/investments
// @access  Public
const createInvestment = async (req, res) => {
  try {
    const investment = await Investment.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Investment created successfully',
      data: investment,
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
      message: 'Error creating investment',
      error: error.message,
    });
  }
};

// @desc    Update investment
// @route   PUT /api/investments/:id
// @access  Public
const updateInvestment = async (req, res) => {
  try {
    const investment = await Investment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Investment updated successfully',
      data: investment,
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
      message: 'Error updating investment',
      error: error.message,
    });
  }
};

// @desc    Delete investment
// @route   DELETE /api/investments/:id
// @access  Public
const deleteInvestment = async (req, res) => {
  try {
    const investment = await Investment.findByIdAndDelete(req.params.id);

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Investment deleted successfully',
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting investment',
      error: error.message,
    });
  }
};

// @desc    Get investment summary
// @route   GET /api/investments/summary
// @access  Public
const getInvestmentSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = {};

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    // Overall summary by type
    const summary = await Investment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Per-owner breakdown
    const ownerSummary = await Investment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { owner: '$owner', ownerName: '$ownerName', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Build per-owner map
    const ownerMap = {};
    for (const item of ownerSummary) {
      const ownerId = item._id.owner.toString();
      if (!ownerMap[ownerId]) {
        ownerMap[ownerId] = {
          ownerId,
          ownerName: item._id.ownerName,
          totalInvestments: 0,
          totalWithdrawals: 0,
          netBalance: 0,
        };
      }
      if (item._id.type === 'investment') {
        ownerMap[ownerId].totalInvestments = item.total;
      } else {
        ownerMap[ownerId].totalWithdrawals = item.total;
      }
    }
    // Calculate net balance per owner
    const byOwner = Object.values(ownerMap).map((o) => ({
      ...o,
      netBalance: o.totalInvestments - o.totalWithdrawals,
    }));

    const totalInvestments = summary.find((s) => s._id === 'investment')?.total || 0;
    const totalWithdrawals = summary.find((s) => s._id === 'withdrawal')?.total || 0;
    const netBalance = totalInvestments - totalWithdrawals;

    res.status(200).json({
      success: true,
      data: {
        totalInvestments,
        totalWithdrawals,
        netBalance,
        byType: summary,
        byOwner,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching investment summary',
      error: error.message,
    });
  }
};

module.exports = {
  getInvestments,
  getInvestment,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  getInvestmentSummary,
};
