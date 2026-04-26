const express = require('express');
const router = express.Router();
const {
  getInvestments,
  getInvestment,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  getInvestmentSummary,
} = require('../controllers/investmentController');

// Special routes (must come before :id routes)
router.get('/summary', getInvestmentSummary);

// Standard CRUD routes
router.route('/').get(getInvestments).post(createInvestment);

router.route('/:id').get(getInvestment).put(updateInvestment).delete(deleteInvestment);

module.exports = router;
