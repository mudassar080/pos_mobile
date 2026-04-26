const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  makePayment,
  getSuppliersSummary,
  linkCustomer,
  settleLinkedBalance,
} = require('../controllers/supplierController');

// Special routes (must come before :id routes)
router.get('/summary', getSuppliersSummary);

// Standard CRUD routes
router.route('/').get(getSuppliers).post(createSupplier);

router.route('/:id').get(getSupplier).put(updateSupplier).delete(deleteSupplier);

// Payment management
router.patch('/:id/payment', makePayment);

// Linking and settlement
router.patch('/:id/link-customer', linkCustomer);
router.post('/:id/settle', settleLinkedBalance);

module.exports = router;
