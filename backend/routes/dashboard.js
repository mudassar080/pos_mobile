const express = require('express');
const router = express.Router();
const { getCashInHand } = require('../controllers/dashboardController');

router.get('/cash-in-hand', getCashInHand);

module.exports = router;
