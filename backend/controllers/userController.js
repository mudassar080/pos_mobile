const User = require('../models/User');
const logActivity = require('../utils/logActivity');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

/** Roles that can be assigned via the app (superadmin is bootstrap-only). */
const APP_ASSIGNABLE_ROLES = ['admin', 'staff'];

const rejectSuperadminAssignment = (role) =>
  role === 'superadmin'
    ? {
        success: false,
        message: 'Superadmin accounts cannot be created or assigned from the app',
      }
    : null;

// @desc    Get all users
// @route   GET /api/users
// @access  Superadmin
const getUsers = async (req, res) => {
  try {
    const paging = parsePagination(req, res);
    if (!paging) return;

    const { page, limit, skip } = paging;
    const { search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort(sort).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message,
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Superadmin
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Superadmin
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, isActive } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    const superadminRejected = rejectSuperadminAssignment(role);
    if (superadminRejected) {
      return res.status(400).json(superadminRejected);
    }

    const normalizedRole = APP_ASSIGNABLE_ROLES.includes(role) ? role : 'staff';

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: normalizedRole,
      isActive: isActive !== undefined ? isActive : true,
    });

    const safe = await User.findById(user._id).select('-password');

    await logActivity(req, {
      action: 'create',
      entity: 'user',
      entityId: user._id,
      entityLabel: user.email,
      description: `Created user ${user.name} (${user.role})`,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: safe,
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

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message,
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Superadmin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { name, email, password, role, isActive } = req.body;

    if (name !== undefined) user.name = name.trim();
    if (email !== undefined) {
      const normalized = email.toLowerCase().trim();
      const duplicate = await User.findOne({
        email: normalized,
        _id: { $ne: user._id },
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'A user with this email already exists',
        });
      }
      user.email = normalized;
    }
    if (role !== undefined) {
      const superadminRejected = rejectSuperadminAssignment(role);
      if (superadminRejected) {
        return res.status(400).json(superadminRejected);
      }
      if (user.role === 'superadmin' && role !== 'superadmin') {
        return res.status(400).json({
          success: false,
          message: 'Superadmin role cannot be changed from the app',
        });
      }
      if (!APP_ASSIGNABLE_ROLES.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be admin or staff',
        });
      }
      user.role = role;
    }
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password;

    await user.save();

    const safe = await User.findById(user._id).select('-password');

    await logActivity(req, {
      action: 'update',
      entity: 'user',
      entityId: user._id,
      entityLabel: user.email,
      description: `Updated user ${user.name}`,
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: safe,
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
      message: 'Error updating user',
      error: error.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Superadmin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    if (user.role === 'superadmin') {
      const superadminCount = await User.countDocuments({ role: 'superadmin' });
      if (superadminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last superadmin account',
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    await logActivity(req, {
      action: 'delete',
      entity: 'user',
      entityId: user._id,
      entityLabel: user.email,
      description: `Deleted user ${user.name}`,
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message,
    });
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
