const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const ensureDefaultSuperAdmin = require('./utils/ensureDefaultSuperAdmin');
const { protect } = require('./middleware/auth');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', protect, require('./routes/products'));
app.use('/api/customers', protect, require('./routes/customers'));
app.use('/api/suppliers', protect, require('./routes/suppliers'));
app.use('/api/sales', protect, require('./routes/sales'));
app.use('/api/sale-returns', protect, require('./routes/saleReturns'));
app.use('/api/purchases', protect, require('./routes/purchases'));
app.use('/api/purchase-returns', protect, require('./routes/purchaseReturns'));
app.use('/api/expenses', protect, require('./routes/expenses'));
app.use('/api/owners', protect, require('./routes/owners'));
app.use('/api/investments', protect, require('./routes/investments'));
app.use('/api/other-income', protect, require('./routes/otherIncome'));
app.use('/api/dashboard', protect, require('./routes/dashboard'));
app.use('/api/settings', protect, require('./routes/settings'));
app.use('/api/users', require('./routes/users'));
app.use('/api/activity-logs', require('./routes/activityLogs'));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const startServer = async () => {
  await connectDB();
  await ensureDefaultSuperAdmin();

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
