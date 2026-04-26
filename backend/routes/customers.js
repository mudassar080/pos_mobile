const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  receivePayment,
  getCustomersSummary,
  linkSupplier,
} = require('../controllers/customerController');

// Special routes (must come before :id routes)
router.get('/summary', getCustomersSummary);

// Standard CRUD routes
router.route('/').get(getCustomers).post(createCustomer);

router.route('/:id').get(getCustomer).put(updateCustomer).delete(deleteCustomer);

// Payment management
router.patch('/:id/payment', receivePayment);

// Linking
router.patch('/:id/link-supplier', linkSupplier);

module.exports = router;
