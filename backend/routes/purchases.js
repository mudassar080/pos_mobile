const express = require('express');
const router = express.Router();
const {
  getPurchases,
  getPurchase,
  createPurchase,
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

router.get('/:id', getPurchase);

// Purchase actions
router.patch('/:id/payment', updatePayment);
router.patch('/:id/cancel', cancelPurchase);

module.exports = router;
