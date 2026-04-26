# POS System Backend API

Express.js backend with MongoDB for the POS (Point of Sale) mobile shop system.

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your MongoDB connection string.

3. **Start the server:**
   ```bash
   # Development mode (with hot reload)
   npm run dev

   # Production mode
   npm start
   ```

The server will run on `http://localhost:5000`

## API Endpoints

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products (with pagination & filters) |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create new product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/products/low-stock` | Get low stock accessories |
| GET | `/api/products/stock-summary` | Get stock summary (phones & accessories) |
| GET | `/api/products/categories` | Get all categories |
| PATCH | `/api/products/:id/stock` | Update product stock |

### Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | Get all customers |
| GET | `/api/customers/:id` | Get single customer |
| POST | `/api/customers` | Create new customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |
| GET | `/api/customers/summary` | Get customers summary (receivables) |
| PATCH | `/api/customers/:id/payment` | Receive payment from customer |

### Suppliers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/suppliers` | Get all suppliers |
| GET | `/api/suppliers/:id` | Get single supplier |
| POST | `/api/suppliers` | Create new supplier |
| PUT | `/api/suppliers/:id` | Update supplier |
| DELETE | `/api/suppliers/:id` | Delete supplier |
| GET | `/api/suppliers/summary` | Get suppliers summary (payables) |
| PATCH | `/api/suppliers/:id/payment` | Make payment to supplier |

### Sales

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales` | Get all sales |
| GET | `/api/sales/:id` | Get single sale |
| POST | `/api/sales` | Create new sale |
| GET | `/api/sales/summary` | Get sales summary |
| PATCH | `/api/sales/:id/payment` | Update sale payment |
| PATCH | `/api/sales/:id/cancel` | Cancel sale |

### Purchases

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/purchases` | Get all purchases |
| GET | `/api/purchases/:id` | Get single purchase |
| POST | `/api/purchases` | Create new purchase |
| GET | `/api/purchases/summary` | Get purchases summary |
| PATCH | `/api/purchases/:id/payment` | Update purchase payment |
| PATCH | `/api/purchases/:id/cancel` | Cancel purchase |

### Expenses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | Get all expenses |
| GET | `/api/expenses/:id` | Get single expense |
| POST | `/api/expenses` | Create new expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/expenses/summary` | Get expenses summary by category |

### Investments (Owner Capital)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/investments` | Get all investments |
| GET | `/api/investments/:id` | Get single investment |
| POST | `/api/investments` | Create investment/withdrawal |
| PUT | `/api/investments/:id` | Update investment |
| DELETE | `/api/investments/:id` | Delete investment |
| GET | `/api/investments/summary` | Get investment summary |

### Other Income

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/other-income` | Get all other income |
| GET | `/api/other-income/:id` | Get single income |
| POST | `/api/other-income` | Create other income |
| PUT | `/api/other-income/:id` | Update other income |
| DELETE | `/api/other-income/:id` | Delete other income |
| GET | `/api/other-income/summary` | Get other income summary |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health check |

## Data Models

### Product
```json
{
  "name": "string (required)",
  "category": "string (required)",
  "brand": "string",
  "model": "string",
  "type": "phone | accessory",
  "isImeiBased": "boolean",
  "imei": "string (for phones)",
  "color": "string",
  "purchasePrice": "number (required)",
  "sellingPrice": "number",
  "quantity": "number (for accessories)",
  "status": "available | sold | returned | damaged"
}
```

### Customer / Supplier
```json
{
  "name": "string (required)",
  "phone": "string (required)",
  "email": "string",
  "address": "string",
  "totalPurchases": "number (computed)",
  "outstanding": "number (computed)",
  "lastPurchase": "date (computed)"
}
```

### Sale
```json
{
  "invoiceNumber": "string (auto-generated)",
  "date": "date",
  "customer": "ObjectId",
  "customerName": "string",
  "items": [{ "product", "productName", "imei", "quantity", "price", "total" }],
  "amount": "number",
  "paid": "number",
  "paymentMode": "Cash | UPI | Card | Bank Transfer | Credit | Mixed",
  "status": "paid | partial | credit | cancelled | returned"
}
```

### Purchase
```json
{
  "purchaseNumber": "string (auto-generated)",
  "date": "date",
  "supplier": "ObjectId (required)",
  "supplierName": "string",
  "items": [{ "product", "productName", "imei", "quantity", "price", "total" }],
  "amount": "number",
  "paid": "number",
  "balance": "number (computed)",
  "status": "paid | partial | credit | cancelled"
}
```

### Expense
```json
{
  "date": "date",
  "category": "Rent | Salary | Electricity | Repair | Marketing | Transport | Other",
  "amount": "number (required)",
  "description": "string",
  "paymentMode": "Cash | UPI | Bank Transfer | Card"
}
```

### Investment
```json
{
  "date": "date",
  "type": "investment | withdrawal",
  "amount": "number (required)",
  "description": "string"
}
```

### Other Income
```json
{
  "date": "date",
  "category": "Service | Commission | Old Phone Resale | Accessories Repair | Other",
  "amount": "number (required)",
  "description": "string",
  "paymentMode": "Cash | UPI | Bank Transfer | Card"
}
```

## Project Structure

```
backend/
├── config/
│   └── db.js                    # MongoDB connection
├── controllers/
│   ├── customerController.js
│   ├── expenseController.js
│   ├── investmentController.js
│   ├── otherIncomeController.js
│   ├── productController.js
│   ├── purchaseController.js
│   ├── saleController.js
│   └── supplierController.js
├── models/
│   ├── Customer.js
│   ├── Expense.js
│   ├── Investment.js
│   ├── OtherIncome.js
│   ├── Product.js
│   ├── Purchase.js
│   ├── Sale.js
│   └── Supplier.js
├── routes/
│   ├── customers.js
│   ├── expenses.js
│   ├── investments.js
│   ├── otherIncome.js
│   ├── products.js
│   ├── purchases.js
│   ├── sales.js
│   └── suppliers.js
├── .env
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Features

- **IMEI-based tracking** for phones (individual tracking)
- **Quantity-based tracking** for accessories
- **Automatic invoice/PO number generation**
- **Stock management** - auto-updates on sales and purchases
- **Customer receivables tracking**
- **Supplier payables tracking**
- **Low stock alerts** for accessories
- **Expense tracking by category**
- **Owner investment/withdrawal tracking**
- **Other income sources tracking**
- **Summary reports** for all modules
