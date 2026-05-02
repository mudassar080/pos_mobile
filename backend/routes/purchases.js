const express = require('express');
const router = express.Router();
const {
  getPurchases,
  getPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase,
  updatePayment,
  cancelPurchase,
  getPurchaseSummary,
  getPayables,
} = require('../controllers/purchaseController');

// Special routes
router.get('/summary', getPurchaseSummary);
router.get('/payables', getPayables);

// Standard routes
router.route('/').get(getPurchases).post(createPurchase);

router
  .route('/:id')
  .get(getPurchase)
  .put(updatePurchase)
  .delete(deletePurchase);

// Purchase actions
router.patch('/:id/payment', updatePayment);
router.patch('/:id/cancel', cancelPurchase);

module.exports = router;
