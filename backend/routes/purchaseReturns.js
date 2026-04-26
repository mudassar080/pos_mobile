const express = require('express');
const router = express.Router();
const {
  getPurchaseReturns,
  getPurchaseReturn,
  getReturnedQuantities,
  createPurchaseReturn,
  deletePurchaseReturn,
  getPurchaseReturnSummary,
} = require('../controllers/purchaseReturnController');

// Special routes (must be before /:id)
router.get('/summary', getPurchaseReturnSummary);
router.get('/returned-quantities/:purchaseId', getReturnedQuantities);

// CRUD routes
router.route('/').get(getPurchaseReturns).post(createPurchaseReturn);
router.route('/:id').get(getPurchaseReturn).delete(deletePurchaseReturn);

module.exports = router;
