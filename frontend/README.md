# Mobile Phone Retail Shop POS System

A comprehensive, production-ready Point of Sale (POS) system built specifically for mobile phone retail businesses. Features IMEI-based phone tracking, complete inventory management, customer/supplier management, and financial accounting.

## Features

### Authentication
- Secure login system with mock authentication
- Session management
- User role-based access

### Dashboard
- Real-time sales metrics (today/monthly)
- Stock value and low stock alerts
- Receivables and payables tracking
- Net profit calculations
- Interactive charts and graphs
- Sales trends visualization

### Sales Management
- **New Sale**: Create sales with multiple items
  - Select/add customers or walk-in sales
  - IMEI-based tracking for phones
  - Quantity-based tracking for accessories
  - Multiple items per invoice
  - Payment modes: Cash, UPI, Card, Credit, Partial
  - Invoice preview
- **Sales List**: View all sales with filtering

### Purchase Management
- **Add Purchase**: Record inventory purchases
  - Select supplier
  - Add IMEI for phones
  - Track purchase prices
  - Paid/credit options
- **Purchase List**: View purchase history

### Stock Management
- IMEI-based phone inventory
- Quantity-based accessory inventory
- Stock status tracking: Available, Sold, Returned, Damaged
- Low stock indicators and alerts
- Real-time inventory valuation

### Customer Management
- Add/edit customer details
- Purchase history tracking
- Outstanding receivables
- Payment collection

### Supplier Management
- Add/edit supplier information
- Purchase history
- Outstanding payables
- Payment tracking

### Financial Management
- **Expenses**: Record business expenses
  - Categories: Rent, Salary, Electricity, Repair, Marketing, etc.
  - Date filtering
- **Other Income**: Track non-sale revenue
  - Service income
  - Commission
  - Old phone resale
- **Owner Investment**: Track capital and withdrawals

## Technology Stack

### Frontend
- **Framework**: Next.js 13 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **API**: RESTful API

## Project Architecture

```
├── app/                      # Next.js frontend app directory
│   ├── dashboard/           # Dashboard page
│   ├── sales/               # Sales module
│   │   └── new/            # Create new sale
│   ├── purchases/           # Purchase module
│   │   └── new/            # Create new purchase
│   ├── stock/              # Stock management
│   ├── customers/          # Customer management
│   ├── suppliers/          # Supplier management
│   ├── products/           # Product management
│   ├── expenses/           # Expense management
│   ├── other-income/       # Other income tracking
│   └── investments/        # Owner investment
├── backend/                 # Node.js Express backend
│   ├── config/             # Database configuration
│   ├── controllers/        # Business logic
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   └── server.js           # Express server entry
├── components/
│   ├── layout/             # Layout components
│   └── ui/                 # shadcn/ui components
└── lib/
    ├── api.ts              # API client for backend
    └── auth-context.tsx    # Authentication context
```

## Database Models

The system uses MongoDB with the following collections:
- `products` - Product master with IMEI tracking for phones
- `customers` - Customer records with receivables tracking
- `suppliers` - Supplier records with payables tracking
- `sales` - Sales transactions with items
- `purchases` - Purchase records with items
- `expenses` - Business expenses
- `otherincome` - Non-sale income
- `investments` - Owner capital tracking

## Getting Started

### 1. Install Frontend Dependencies
```bash
npm install
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Configure Environment Variables

**Frontend** - Create `.env.local` file in root:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Backend** - Create `.env` file in backend folder:
```
MONGODB_URI=mongodb://localhost:27017/pos_system
PORT=5000
NODE_ENV=development
```

### 4. Start MongoDB
Make sure MongoDB is running on your system.

### 5. Start Backend Server
```bash
cd backend
npm run dev
```

### 6. Start Frontend Development Server
```bash
npm run dev
```

### 7. Login Credentials
```
Email: admin@pos.com
Password: admin123
```

## API Endpoints

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/low-stock` - Get low stock items
- `GET /api/products/stock-summary` - Get stock summary

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `PATCH /api/customers/:id/payment` - Receive payment
- `GET /api/customers/summary` - Get customers summary

### Suppliers
- `GET /api/suppliers` - List all suppliers
- `POST /api/suppliers` - Create supplier
- `GET /api/suppliers/:id` - Get supplier details
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier
- `PATCH /api/suppliers/:id/payment` - Make payment
- `GET /api/suppliers/summary` - Get suppliers summary

### Sales
- `GET /api/sales` - List all sales
- `POST /api/sales` - Create sale
- `GET /api/sales/:id` - Get sale details
- `PATCH /api/sales/:id/payment` - Update payment
- `PATCH /api/sales/:id/cancel` - Cancel sale
- `GET /api/sales/summary` - Get sales summary

### Purchases
- `GET /api/purchases` - List all purchases
- `POST /api/purchases` - Create purchase
- `GET /api/purchases/:id` - Get purchase details
- `PATCH /api/purchases/:id/payment` - Update payment
- `PATCH /api/purchases/:id/cancel` - Cancel purchase
- `GET /api/purchases/summary` - Get purchases summary

### Expenses
- `GET /api/expenses` - List all expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/:id` - Get expense details
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/summary` - Get expenses summary

### Investments
- `GET /api/investments` - List all investments
- `POST /api/investments` - Create investment/withdrawal
- `GET /api/investments/:id` - Get investment details
- `PUT /api/investments/:id` - Update investment
- `DELETE /api/investments/:id` - Delete investment
- `GET /api/investments/summary` - Get investments summary

### Other Income
- `GET /api/other-income` - List all other income
- `POST /api/other-income` - Create other income
- `GET /api/other-income/:id` - Get other income details
- `PUT /api/other-income/:id` - Update other income
- `DELETE /api/other-income/:id` - Delete other income
- `GET /api/other-income/summary` - Get other income summary

## Key Features Explained

### IMEI-Based Tracking
Each mobile phone is tracked individually using its unique IMEI number. This ensures:
- Accurate inventory management
- Easy warranty tracking
- Return verification
- Theft prevention

### Multi-Payment Support
- **Cash**: Immediate full payment
- **UPI/Card**: Digital payments
- **Credit**: Full amount on credit
- **Partial**: Part payment with remaining balance tracked

### Automatic Calculations
- Subtotals and totals
- Profit margin calculations
- Outstanding balance tracking

### Real-time Updates
- Stock levels update on sales/returns
- Customer/supplier balances auto-calculated
- Dashboard metrics refresh automatically

## Business Use Cases

1. **Daily Sales**: Quick POS interface for fast checkout
2. **Inventory Control**: Track every phone by IMEI
3. **Credit Management**: Monitor customer dues
4. **Supplier Relations**: Track payables and purchase history
5. **Financial Reporting**: Comprehensive analytics

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is proprietary software designed for mobile phone retail businesses.

## Support

For support and inquiries, contact your system administrator.

---

Built with Next.js, TypeScript, Express.js, and MongoDB for production-ready performance and reliability.
