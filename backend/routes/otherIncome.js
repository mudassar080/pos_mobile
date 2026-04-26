const express = require('express');
const router = express.Router();
const {
  getOtherIncomes,
  getOtherIncome,
  createOtherIncome,
  updateOtherIncome,
  deleteOtherIncome,
  getOtherIncomeSummary,
} = require('../controllers/otherIncomeController');

// Special routes (must come before :id routes)
router.get('/summary', getOtherIncomeSummary);

// Standard CRUD routes
router.route('/').get(getOtherIncomes).post(createOtherIncome);

router.route('/:id').get(getOtherIncome).put(updateOtherIncome).delete(deleteOtherIncome);

module.exports = router;
