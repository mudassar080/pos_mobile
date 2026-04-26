'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DollarSign,
  Package,
  TrendingUp,
  AlertTriangle,
  Wallet,
  ShoppingCart,
  Users,
  Loader2,
  RotateCcw,
  Undo2,
  Receipt,
  BadgeDollarSign,
  Banknote,
  Calendar as CalendarIcon,
  Clock3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  salesApi,
  customersApi,
  suppliersApi,
  productsApi,
  expensesApi,
  otherIncomeApi,
  purchasesApi,
  saleReturnsApi,
  purchaseReturnsApi,
  dashboardApi,
} from '@/lib/api';
import { formatCurrency } from '@/utils/constant';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import moment from 'moment';

// ─── Dashboard Component ────────────────────────────────────────────────────
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [salesSummary, setSalesSummary] = useState<any>(null);
  const [customerSummary, setCustomerSummary] = useState<any>(null);
  const [supplierSummary, setSupplierSummary] = useState<any>(null);
  const [stockSummary, setStockSummary] = useState<any>(null);
  const [expenseSummary, setExpenseSummary] = useState<any>(null);
  const [purchaseSummary, setPurchaseSummary] = useState<any>(null);
  const [saleReturnSummary, setSaleReturnSummary] = useState<any>(null);
  const [purchaseReturnSummary, setPurchaseReturnSummary] = useState<any>(null);
  const [otherIncomeSummary, setOtherIncomeSummary] = useState<any>(null);
  const [cashInHand, setCashInHand] = useState<any>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [now, setNow] = useState(new Date());

  const fetchDashboardData = async () => {
    try {
      const summaryParams: Record<string, string> = {};
      if (startDate) summaryParams.startDate = startDate;
      if (endDate) summaryParams.endDate = endDate;

      const trendParams =
        summaryParams.startDate || summaryParams.endDate
          ? summaryParams
          : { days: '7' };

      const [
        salesRes,
        customerRes,
        supplierRes,
        stockRes,
        expenseRes,
        purchaseRes,
        saleReturnRes,
        purchaseReturnRes,
        otherIncomeRes,
        cashInHandRes,
        lowStockRes,
        trendRes,
      ] = await Promise.all([
        salesApi.getSummary(summaryParams),
        customersApi.getSummary(),
        suppliersApi.getSummary(),
        productsApi.getStockSummary(summaryParams),
        expensesApi.getSummary(summaryParams),
        purchasesApi.getSummary(summaryParams),
        saleReturnsApi.getSummary(summaryParams),
        purchaseReturnsApi.getSummary(summaryParams),
        otherIncomeApi.getSummary(summaryParams),
        dashboardApi.getCashInHand(summaryParams),
        productsApi.getLowStock(summaryParams),
        salesApi.getTrend(trendParams),
      ]);

      if (salesRes.success) setSalesSummary(salesRes.data);
      if (customerRes.success) setCustomerSummary(customerRes.data);
      if (supplierRes.success) setSupplierSummary(supplierRes.data);
      if (stockRes.success) setStockSummary(stockRes.data);
      if (expenseRes.success) setExpenseSummary(expenseRes.data);
      if (purchaseRes.success) setPurchaseSummary(purchaseRes.data);
      if (saleReturnRes.success) setSaleReturnSummary(saleReturnRes.data);
      if (purchaseReturnRes.success) setPurchaseReturnSummary(purchaseReturnRes.data);
      if (otherIncomeRes.success) setOtherIncomeSummary(otherIncomeRes.data);
      if (cashInHandRes.success) setCashInHand(cashInHandRes.data);
      if (lowStockRes.success) setLowStock(lowStockRes.data || []);
      if (trendRes.success) setSalesTrend(trendRes.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const categoryData = [
    { name: 'Phones', value: stockSummary?.phones?.value || 0, color: '#0ea5e9' },
    { name: 'Accessories', value: stockSummary?.accessories?.value || 0, color: '#8b5cf6' },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </MainLayout>
    );
  }

  const hasDateFilter = Boolean(startDate || endDate);
  const grossProfit = salesSummary?.monthProfit || 0;
  const otherIncomeForProfit = hasDateFilter
    ? otherIncomeSummary?.totalIncome || 0
    : otherIncomeSummary?.todayIncome || 0;
  const expenseForProfit = expenseSummary?.totalExpenses || 0;
  const netProfit = grossProfit + otherIncomeForProfit - expenseForProfit;
  const formattedDateTime = format(now, 'dd MMM yyyy, hh:mm a');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600">Overview of your business performance</p>
          </div>
          <div className="flex items-end gap-2">
            <div className="h-10 rounded-md border border-input bg-background px-3 text-sm text-slate-700 flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-slate-500" />
              <span className="font-medium">{formattedDateTime}</span>
            </div>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'PPP')} - {format(dateRange.to, 'PPP')}
                      </>
                    ) : (
                      format(dateRange.from, 'PPP')
                    )
                  ) : (
                    <span>Select date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  numberOfMonths={2}
                  selected={dateRange}
                  onSelect={(range, selectedDay) => {
                    // If a full range already exists, a new click should start a fresh range.
                    // This makes it easy to change start date without "sticking" old end date.
                    if (dateRange?.from && dateRange?.to && selectedDay) {
                      setDateRange({ from: selectedDay, to: undefined });
                      return;
                    }
                    setDateRange(range);
                  }}
                  initialFocus
                />
                <div className="flex items-center justify-between border-t p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateRange(undefined);
                      setStartDate('');
                      setEndDate('');
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    disabled={!dateRange?.from || !dateRange?.to}
                    onClick={() => {
                      if (!dateRange?.from || !dateRange?.to) return;
                      setStartDate(moment(dateRange.from).startOf('day').toISOString());
                      setEndDate(moment(dateRange.to).endOf('day').toISOString());
                      setIsDatePickerOpen(false);
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            {hasDateFilter && (
              <Button
                variant="outline"
                onClick={() => {
                  setDateRange(undefined);
                  setStartDate('');
                  setEndDate('');
                  setIsDatePickerOpen(false);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Primary Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link href="/sales" className="block">
          <Card className="transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {hasDateFilter ? 'Selected Sales' : "Today's Sales"}
              </CardTitle>
              <ShoppingCart className="w-4 h-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(hasDateFilter ? salesSummary?.totalSales || 0 : salesSummary?.todaySales || 0)}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {hasDateFilter ? salesSummary?.totalCount || 0 : salesSummary?.todayCount || 0} transactions
              </p>
            </CardContent>
          </Card>
          </Link>

          <Link href="/sales" className="block">
          <Card className="transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {hasDateFilter ? 'Range Sales' : 'Monthly Sales'}
              </CardTitle>
              <DollarSign className="w-4 h-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  hasDateFilter
                    ? salesSummary?.totalSales || 0
                    : salesSummary?.monthSales || salesSummary?.totalSales || 0
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {hasDateFilter
                  ? salesSummary?.totalCount || 0
                  : salesSummary?.monthCount || salesSummary?.totalCount || 0}{' '}
                transactions
              </p>
            </CardContent>
          </Card>
          </Link>

          <Link href="/stock" className="block">
          <Card className="transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Stock Value</CardTitle>
              <Package className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stockSummary?.totalValue || 0)}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {(stockSummary?.totalSellingValue || 0) > 0 && (
                  <>Sale Value: {formatCurrency(stockSummary?.totalSellingValue || 0)} | </>
                )}
                {stockSummary?.totalItems || 0} items
              </p>
            </CardContent>
          </Card>
          </Link>

          <Link href="/sales" className="block">
          <Card className="transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Gross Profit
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatCurrency(grossProfit)}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Selling price - Purchase price
              </p>
            </CardContent>
          </Card>
          </Link>

          <Link href="/sales" className="block">
          <Card className="transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Net Profit
              </CardTitle>
              <Banknote className="w-4 h-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatCurrency(netProfit)}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Gross: {formatCurrency(grossProfit)} + Other: {formatCurrency(otherIncomeForProfit)} - Exp:{' '}
                {formatCurrency(expenseForProfit)}
              </p>
            </CardContent>
          </Card>
          </Link>
        </div>

        {/* Today's Activity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link href="/purchases" className="block">
          <Card className="border-l-4 border-l-indigo-500 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {hasDateFilter ? 'Range Purchase' : 'Today Purchase'}
              </CardTitle>
              <ShoppingCart className="w-4 h-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-indigo-600">
                {formatCurrency(
                  hasDateFilter
                    ? purchaseSummary?.totalPurchases || 0
                    : purchaseSummary?.todayPurchases || 0
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {hasDateFilter ? purchaseSummary?.count || 0 : purchaseSummary?.todayCount || 0} purchases
              </p>
            </CardContent>
          </Card>
          </Link>

          <Link href="/sales/returns" className="block">
          <Card className="border-l-4 border-l-orange-500 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {hasDateFilter ? 'Range Sale Return' : 'Sale Return'}
              </CardTitle>
              <Undo2 className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-orange-600">
                {formatCurrency(
                  hasDateFilter ? saleReturnSummary?.totalAmount || 0 : saleReturnSummary?.todayAmount || 0
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {hasDateFilter
                  ? `${saleReturnSummary?.totalReturns || 0} returns`
                  : `${saleReturnSummary?.todayReturns || 0} returns today`}
              </p>
            </CardContent>
          </Card>
          </Link>

          <Link href="/purchases/returns" className="block">
          <Card className="border-l-4 border-l-purple-500 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {hasDateFilter ? 'Range Purchase Return' : 'Purchase Return'}
              </CardTitle>
              <RotateCcw className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-purple-600">
                {formatCurrency(
                  hasDateFilter
                    ? purchaseReturnSummary?.totalAmount || 0
                    : purchaseReturnSummary?.todayAmount || 0
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {hasDateFilter
                  ? `${purchaseReturnSummary?.totalReturns || 0} returns`
                  : `${purchaseReturnSummary?.todayReturns || 0} returns today`}
              </p>
            </CardContent>
          </Card>
          </Link>

          <Link href="/expenses" className="block">
          <Card className="border-l-4 border-l-red-500 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {hasDateFilter ? 'Range Expense' : 'Today Expense'}
              </CardTitle>
              <Receipt className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(
                  hasDateFilter ? expenseSummary?.totalExpenses || 0 : expenseSummary?.todayExpenses || 0
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {hasDateFilter ? expenseSummary?.totalCount || 0 : expenseSummary?.todayCount || 0} entries
              </p>
            </CardContent>
          </Card>
          </Link>

          <Link href="/other-income" className="block">
          <Card className="border-l-4 border-l-emerald-500 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {hasDateFilter ? 'Range Other Income' : 'Today Other Income'}
              </CardTitle>
              <BadgeDollarSign className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-emerald-600">
                {formatCurrency(
                  hasDateFilter ? otherIncomeSummary?.totalIncome || 0 : otherIncomeSummary?.todayIncome || 0
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {hasDateFilter ? otherIncomeSummary?.totalCount || 0 : otherIncomeSummary?.todayCount || 0} entries
              </p>
            </CardContent>
          </Card>
          </Link>
        </div>

        {/* Cash in Hand, Receivables and Payables */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard" className="block">
          <Card className="bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-sky-700">
                Cash in Hand
              </CardTitle>
              <Banknote className="w-5 h-5 text-sky-600" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${(cashInHand?.cashInHand || 0) >= 0 ? 'text-sky-700' : 'text-red-600'}`}
              >
                {formatCurrency(cashInHand?.cashInHand || 0)}
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-green-600">In: {formatCurrency(cashInHand?.totalCashIn || 0)}</span>
                <span className="text-red-500">Out: {formatCurrency(cashInHand?.totalCashOut || 0)}</span>
              </div>
            </CardContent>
          </Card>
          </Link>

          <Link href="/receivables" className="block">
          <Card className="transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Customer Receivables
              </CardTitle>
              <Users className="w-4 h-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(customerSummary?.totalReceivables || 0)}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                From {customerSummary?.customersWithCredit || 0} customers
              </p>
            </CardContent>
          </Card>
          </Link>

          <Link href="/payables" className="block">
          <Card className="transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Supplier Payables
              </CardTitle>
              <Wallet className="w-4 h-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(supplierSummary?.totalPayables || 0)}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                To {supplierSummary?.suppliersWithCredit || 0} suppliers
              </p>
            </CardContent>
          </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {hasDateFilter ? 'Sales Trend (Selected Range)' : 'Sales Trend (Last 7 Days)'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Sales']}
                      labelFormatter={(label) => `Day: ${label}`}
                    />
                    <Line type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-400">
                  No sales data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stock by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-slate-400">
                  No stock data available
                </div>
              )}
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#0ea5e9]" />
                    <span>Phones</span>
                  </div>
                  <span className="font-medium">
                    {stockSummary?.phones?.available || 0} units (
                    {formatCurrency(stockSummary?.phones?.value || 0)})
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
                    <span>Accessories</span>
                  </div>
                  <span className="font-medium">
                    {stockSummary?.accessories?.totalQuantity || 0} units (
                    {formatCurrency(stockSummary?.accessories?.value || 0)})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-slate-600 text-center py-4">No low stock items</p>
            ) : (
              <div className="space-y-3">
                {lowStock.slice(0, 5).map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-600">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-600">{item.quantity || 0}</div>
                      <div className="text-xs text-slate-600">in stock</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
