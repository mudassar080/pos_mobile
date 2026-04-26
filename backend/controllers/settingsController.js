const ShopProfile = require('../models/ShopProfile');

const defaultProfile = {
  shopName: 'Mobile Shop POS',
  phone: '',
  email: '',
  address: '',
};

// @desc    Get shop profile
// @route   GET /api/settings/shop-profile
// @access  Public
const getShopProfile = async (req, res) => {
  try {
    const profile = await ShopProfile.findOne();

    res.status(200).json({
      success: true,
      data: profile || defaultProfile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shop profile',
      error: error.message,
    });
  }
};

// @desc    Create/update shop profile
// @route   PUT /api/settings/shop-profile
// @access  Public
const upsertShopProfile = async (req, res) => {
  try {
    const { shopName, phone, email, address } = req.body;

    if (!shopName || !shopName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Shop name is required',
      });
    }

    const payload = {
      shopName: shopName.trim(),
      phone: (phone || '').trim(),
      email: (email || '').trim().toLowerCase(),
      address: (address || '').trim(),
    };

    const existing = await ShopProfile.findOne();
    let profile;

    if (existing) {
      Object.assign(existing, payload);
      profile = await existing.save();
    } else {
      profile = await ShopProfile.create(payload);
    }

    res.status(200).json({
      success: true,
      message: 'Shop profile saved successfully',
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving shop profile',
      error: error.message,
    });
  }
};

module.exports = {
  getShopProfile,
  upsertShopProfile,
};
