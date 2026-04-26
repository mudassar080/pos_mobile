const express = require('express');
const router = express.Router();
const {
  getSaleReturns,
  getSaleReturn,
  createSaleReturn,
  deleteSaleReturn,
  getSaleReturnSummary,
} = require('../controllers/saleReturnController');

// Summary route (must be before /:id)
router.get('/summary', getSaleReturnSummary);

// CRUD routes
router.route('/').get(getSaleReturns).post(createSaleReturn);
router.route('/:id').get(getSaleReturn).delete(deleteSaleReturn);

module.exports = router;
