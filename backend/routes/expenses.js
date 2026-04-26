const express = require('express');
const router = express.Router();
const {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesSummary,
} = require('../controllers/expenseController');

// Special routes (must come before :id routes)
router.get('/summary', getExpensesSummary);

// Standard CRUD routes
router.route('/').get(getExpenses).post(createExpense);

router.route('/:id').get(getExpense).put(updateExpense).delete(deleteExpense);

module.exports = router;
