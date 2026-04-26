const express = require('express');
const router = express.Router();
const {
  getSales,
  getSale,
  createSale,
  updatePayment,
  cancelSale,
  deleteSale,
  getSalesSummary,
  getReceivables,
  getSalesTrend,
} = require('../controllers/saleController');

// Special routes (must come before :id routes)
router.get('/summary', getSalesSummary);
router.get('/receivables', getReceivables);
router.get('/trend', getSalesTrend);

// Standard routes
router.route('/').get(getSales).post(createSale);

router.get('/:id', getSale);
router.delete('/:id', deleteSale);

// Sale actions
router.patch('/:id/payment', updatePayment);
router.patch('/:id/cancel', cancelSale);

module.exports = router;
