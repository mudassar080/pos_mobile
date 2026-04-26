const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  updateStock,
  getStockSummary,
  getCategories,
} = require('../controllers/productController');

// Special routes (must come before :id routes)
router.get('/low-stock', getLowStockProducts);
router.get('/stock-summary', getStockSummary);
router.get('/categories', getCategories);

// Standard CRUD routes
router.route('/').get(getProducts).post(createProduct);

router.route('/:id').get(getProduct).put(updateProduct).delete(deleteProduct);

// Stock management
router.patch('/:id/stock', updateStock);

module.exports = router;
