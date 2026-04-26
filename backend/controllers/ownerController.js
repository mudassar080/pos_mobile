const Owner = require('../models/Owner');
const Investment = require('../models/Investment');

// @desc    Get all owners
// @route   GET /api/owners
// @access  Public
const getOwners = async (req, res) => {
  try {
    const { search, sortBy = 'name', sortOrder = 'asc' } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const owners = await Owner.find(query).sort(sort);

    res.status(200).json({
      success: true,
      data: owners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching owners',
      error: error.message,
    });
  }
};

// @desc    Get single owner
// @route   GET /api/owners/:id
// @access  Public
const getOwner = async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found',
      });
    }

    res.status(200).json({
      success: true,
      data: owner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching owner',
      error: error.message,
    });
  }
};

// @desc    Create owner
// @route   POST /api/owners
// @access  Public
const createOwner = async (req, res) => {
  try {
    const owner = await Owner.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Owner created successfully',
      data: owner,
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
      message: 'Error creating owner',
      error: error.message,
    });
  }
};

// @desc    Update owner
// @route   PUT /api/owners/:id
// @access  Public
const updateOwner = async (req, res) => {
  try {
    const owner = await Owner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Owner updated successfully',
      data: owner,
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
      message: 'Error updating owner',
      error: error.message,
    });
  }
};

// @desc    Delete owner
// @route   DELETE /api/owners/:id
// @access  Public
const deleteOwner = async (req, res) => {
  try {
    // Check if owner has investments
    const investmentCount = await Investment.countDocuments({ owner: req.params.id });
    if (investmentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete owner. ${investmentCount} transaction(s) are linked to this owner.`,
      });
    }

    const owner = await Owner.findByIdAndDelete(req.params.id);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Owner deleted successfully',
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting owner',
      error: error.message,
    });
  }
};

module.exports = {
  getOwners,
  getOwner,
  createOwner,
  updateOwner,
  deleteOwner,
};
