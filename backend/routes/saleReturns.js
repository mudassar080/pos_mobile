const express = require('express');
const router = express.Router();
const {
  getSaleReturns,
  getSaleReturn,
  getReturnableSales,
  getReturnedQuantities,
  createSaleReturn,
  deleteSaleReturn,
  getSaleReturnSummary,
} = require('../controllers/saleReturnController');

// Summary route (must be before /:id)
router.get('/summary', getSaleReturnSummary);
router.get('/returnable-sales', getReturnableSales);
router.get('/returned-quantities/:saleId', getReturnedQuantities);

// CRUD routes
router.route('/').get(getSaleReturns).post(createSaleReturn);
router.route('/:id').get(getSaleReturn).delete(deleteSaleReturn);

module.exports = router;
