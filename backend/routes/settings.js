const express = require('express');
const router = express.Router();
const {
  getShopProfile,
  upsertShopProfile,
} = require('../controllers/settingsController');

router.get('/shop-profile', getShopProfile);
router.put('/shop-profile', upsertShopProfile);

module.exports = router;
