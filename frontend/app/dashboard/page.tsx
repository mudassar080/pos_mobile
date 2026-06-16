'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { ColorCard } from '@/components/sales/sales-ui';
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
  RotateCcw,
  Undo2,
  Receipt,
  BadgeDollarSign,
  Banknote,
  Calendar as CalendarIcon,
  Clock3,
  Sparkles,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
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
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/use-permissions';

type CardTheme = {
  bg: string;
  iconWrap: string;
  iconColor: string;
  value: string;
  subtitle: string;
  hover: string;
  accent?: string;
};

const CARD_THEMES = {
  cyan: {
    bg: 'bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-100',
    iconWrap: 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-md shadow-cyan-300/40',
    iconColor: 'text-white',
    value: 'text-cyan-800',
    subtitle: 'text-cyan-700/70',
    hover: 'hover:shadow-cyan-200/60',
  },
  emerald: {
    bg: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100',
    iconWrap: 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-300/40',
    iconColor: 'text-white',
    value: 'text-emerald-800',
    subtitle: 'text-emerald-700/70',
    hover: 'hover:shadow-emerald-200/60',
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-100',
    iconWrap: 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-300/40',
    iconColor: 'text-white',
    value: 'text-indigo-800',
    subtitle: 'text-indigo-700/70',
    hover: 'hover:shadow-indigo-200/60',
  },
  green: {
    bg: 'bg-gradient-to-br from-green-50 via-lime-50 to-emerald-100',
    iconWrap: 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-md shadow-green-300/40',
    iconColor: 'text-white',
    value: 'text-green-800',
    subtitle: 'text-green-700/70',
    hover: 'hover:shadow-green-200/60',
  },
  red: {
    bg: 'bg-gradient-to-br from-red-50 via-rose-50 to-orange-100',
    iconWrap: 'bg-gradient-to-br from-red-500 to-rose-600 shadow-md shadow-red-300/40',
    iconColor: 'text-white',
    value: 'text-red-800',
    subtitle: 'text-red-700/70',
    hover: 'hover:shadow-red-200/60',
  },
  violet: {
    bg: 'bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-100',
    iconWrap: 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-300/40',
    iconColor: 'text-white',
    value: 'text-violet-800',
    subtitle: 'text-violet-700/70',
    hover: 'hover:shadow-violet-200/60',
  },
  indigo: {
    bg: 'bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-100',
    iconWrap: 'bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md shadow-indigo-300/40',
    iconColor: 'text-white',
    value: 'text-indigo-800',
    subtitle: 'text-indigo-700/70',
    hover: 'hover:shadow-indigo-200/60',
    accent: 'border-l-4 border-l-indigo-500',
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100',
    iconWrap: 'bg-gradient-to-br from-orange-400 to-amber-500 shadow-md shadow-orange-300/40',
    iconColor: 'text-white',
    value: 'text-orange-800',
    subtitle: 'text-orange-700/70',
    hover: 'hover:shadow-orange-200/60',
    accent: 'border-l-4 border-l-orange-500',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-100',
    iconWrap: 'bg-gradient-to-br from-purple-500 to-violet-600 shadow-md shadow-purple-300/40',
    iconColor: 'text-white',
    value: 'text-purple-800',
    subtitle: 'text-purple-700/70',
    hover: 'hover:shadow-purple-200/60',
    accent: 'border-l-4 border-l-purple-500',
  },
  rose: {
    bg: 'bg-gradient-to-br from-rose-50 via-red-50 to-pink-100',
    iconWrap: 'bg-gradient-to-br from-rose-500 to-red-600 shadow-md shadow-rose-300/40',
    iconColor: 'text-white',
    value: 'text-rose-800',
    subtitle: 'text-rose-700/70',
    hover: 'hover:shadow-rose-200/60',
    accent: 'border-l-4 border-l-rose-500',
  },
} as const;

type ThemeKey = keyof typeof CARD_THEMES;

type StatCardProps = {
  href: string;
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  theme: ThemeKey;
  valueClassName?: string;
};

function StatCard({ href, title, value, subtitle, icon: Icon, theme, valueClassName }: StatCardProps) {
  const t = CARD_THEMES[theme] as CardTheme;

  return (
    <Link href={href} className="block group">
      <div
        className={cn(
          'relative h-full overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
          t.bg,
          t.hover,
          t.accent
        )}
      >
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/30 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-slate-600/80">
              {title}
            </p>
            <p className={cn('mt-2 text-xl sm:text-2xl font-bold tracking-tight truncate', valueClassName || t.value)}>
              {value}
            </p>
            <p className={cn('mt-1.5 text-xs line-clamp-2', t.subtitle)}>{subtitle}</p>
          </div>
          <div className={cn('rounded-xl p-2.5 shrink-0', t.iconWrap)}>
            <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', t.iconColor)} />
          </div>
        </div>
        <ArrowUpRight className="absolute bottom-3 right-3 h-4 w-4 text-slate-400/0 transition-all group-hover:text-slate-500/60" />
      </div>
    </Link>
  );
}

function SectionHeading({
  title,
  description,
  accent,
}: {
  title: string;
  description?: string;
  accent: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn('mt-1 h-8 w-1.5 rounded-full shrink-0', accent)} />
      <div className="space-y-0.5 min-w-0">
        <h2 className="text-base sm:text-lg font-bold text-slate-800">{title}</h2>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  const skeletonColors = [
    'from-cyan-100 to-blue-100',
    'from-emerald-100 to-teal-100',
    'from-violet-100 to-purple-100',
    'from-orange-100 to-amber-100',
    'from-rose-100 to-pink-100',
  ];

  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-36 rounded-3xl bg-gradient-to-r from-indigo-200 via-violet-200 to-fuchsia-200" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
        {skeletonColors.map((color, i) => (
          <div key={i} className={cn('h-32 rounded-2xl bg-gradient-to-br', color)} />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
        {skeletonColors.map((color, i) => (
          <div key={i} className={cn('h-28 rounded-2xl bg-gradient-to-br', color)} />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { isStaff } = usePermissions();
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
  const [calendarMonths, setCalendarMonths] = useState(1);

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

  useEffect(() => {
    const updateCalendarMonths = () => {
      setCalendarMonths(window.innerWidth >= 768 ? 2 : 1);
    };

    updateCalendarMonths();
    window.addEventListener('resize', updateCalendarMonths);
    return () => window.removeEventListener('resize', updateCalendarMonths);
  }, []);

  const categoryData = [
    { name: 'Phones', value: stockSummary?.phones?.value || 0, color: '#6366f1' },
    { name: 'Accessories', value: stockSummary?.accessories?.value || 0, color: '#ec4899' },
  ];

  if (loading) {
    return (
      <MainLayout>
        <DashboardSkeleton />
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
  const compactDateTime = format(now, 'dd MMM, hh:mm a');
  const todaySales = hasDateFilter ? salesSummary?.totalSales || 0 : salesSummary?.todaySales || 0;

  const clearDateFilter = () => {
    setDateRange(undefined);
    setStartDate('');
    setEndDate('');
    setIsDatePickerOpen(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 sm:p-8 text-white shadow-xl shadow-indigo-300/30">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-fuchsia-400/20 blur-2xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Live business overview
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-sm sm:text-base text-indigo-100 max-w-md">
                {isStaff
                  ? 'Your daily sales, stock, purchases, and expenses'
                  : 'Track sales, stock, profits, and cash flow in real time'}
              </p>
              {hasDateFilter && (
                <span className="inline-flex items-center rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-100 ring-1 ring-amber-300/30">
                  Filtered view active
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 w-full sm:flex-row sm:flex-wrap lg:w-auto">
              <div className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/15 px-3 text-sm backdrop-blur-md ring-1 ring-white/20">
                <Clock3 className="h-4 w-4 text-indigo-100 shrink-0" />
                <span className="font-medium truncate sm:hidden">{compactDateTime}</span>
                <span className="font-medium truncate hidden sm:inline">{formattedDateTime}</span>
              </div>

              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="secondary"
                    className="w-full sm:w-[240px] justify-start rounded-xl h-10 bg-white/95 text-slate-800 hover:bg-white border-0 shadow-md"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-violet-600" />
                    <span className="truncate">
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'PP')} - {format(dateRange.to, 'PP')}
                          </>
                        ) : (
                          format(dateRange.from, 'PP')
                        )
                      ) : (
                        'Select date range'
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="end">
                  <Calendar
                    mode="range"
                    numberOfMonths={calendarMonths}
                    selected={dateRange}
                    onSelect={(range, selectedDay) => {
                      if (dateRange?.from && dateRange?.to && selectedDay) {
                        setDateRange({ from: selectedDay, to: undefined });
                        return;
                      }
                      setDateRange(range);
                    }}
                    initialFocus
                  />
                  <div className="flex items-center justify-between border-t p-3">
                    <Button variant="ghost" size="sm" onClick={clearDateFilter}>
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
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
                  variant="secondary"
                  onClick={clearDateFilter}
                  className="rounded-xl h-10 bg-white/20 text-white hover:bg-white/30 border-0 backdrop-blur-sm"
                >
                  Clear filter
                </Button>
              )}
            </div>
          </div>

          {/* Hero highlight stats */}
          <div className="relative mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-md ring-1 ring-white/20">
              <p className="text-xs font-medium text-indigo-100 uppercase tracking-wide">
                {hasDateFilter ? 'Selected Sales' : "Today's Revenue"}
              </p>
              <p className="mt-1 text-2xl sm:text-3xl font-bold">{formatCurrency(todaySales)}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-md ring-1 ring-white/20">
              <p className="text-xs font-medium text-indigo-100 uppercase tracking-wide">
                {isStaff ? 'Stock Value' : 'Net Profit'}
              </p>
              <p
                className={cn(
                  'mt-1 text-2xl sm:text-3xl font-bold',
                  isStaff ? 'text-white' : netProfit >= 0 ? 'text-emerald-200' : 'text-rose-200'
                )}
              >
                {isStaff
                  ? formatCurrency(stockSummary?.totalValue || 0)
                  : formatCurrency(netProfit)}
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <section className="space-y-3 sm:space-y-4">
          <SectionHeading
            title="Key Metrics"
            description={
              isStaff
                ? 'Sales, stock, purchases, and expenses'
                : 'Sales, stock, and profitability at a glance'
            }
            accent="bg-gradient-to-b from-cyan-400 to-blue-600"
          />
          <div
            className={cn(
              'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4',
              isStaff ? 'xl:grid-cols-4' : 'xl:grid-cols-5'
            )}
          >
            <StatCard
              href="/sales"
              title={hasDateFilter ? 'Selected Sales' : "Today's Sales"}
              value={formatCurrency(todaySales)}
              subtitle={`${hasDateFilter ? salesSummary?.totalCount || 0 : salesSummary?.todayCount || 0} transactions`}
              icon={ShoppingCart}
              theme="cyan"
            />
            {!isStaff && (
              <StatCard
                href="/sales"
                title={hasDateFilter ? 'Range Sales' : 'Monthly Sales'}
                value={formatCurrency(
                  hasDateFilter
                    ? salesSummary?.totalSales || 0
                    : salesSummary?.monthSales || salesSummary?.totalSales || 0
                )}
                subtitle={`${
                  hasDateFilter
                    ? salesSummary?.totalCount || 0
                    : salesSummary?.monthCount || salesSummary?.totalCount || 0
                } transactions`}
                icon={DollarSign}
                theme="emerald"
              />
            )}
            <StatCard
              href="/stock"
              title="Stock Value"
              value={formatCurrency(stockSummary?.totalValue || 0)}
              subtitle={`${
                (stockSummary?.totalSellingValue || 0) > 0
                  ? `Sale Value: ${formatCurrency(stockSummary?.totalSellingValue || 0)} · `
                  : ''
              }${stockSummary?.totalItems || 0} items`}
              icon={Package}
              theme="blue"
            />
            {!isStaff && (
              <>
                <StatCard
                  href="/sales"
                  title="Gross Profit"
                  value={formatCurrency(grossProfit)}
                  subtitle="Selling price - Purchase price"
                  icon={TrendingUp}
                  theme={grossProfit >= 0 ? 'green' : 'red'}
                />
                <StatCard
                  href="/sales"
                  title="Net Profit"
                  value={formatCurrency(netProfit)}
                  subtitle={`Gross: ${formatCurrency(grossProfit)} + Other: ${formatCurrency(otherIncomeForProfit)} - Exp: ${formatCurrency(expenseForProfit)}`}
                  icon={Banknote}
                  theme={netProfit >= 0 ? 'violet' : 'red'}
                />
              </>
            )}
            {isStaff && (
              <>
                <StatCard
                  href="/purchases"
                  title={hasDateFilter ? 'Range Purchase' : 'Today Purchase'}
                  value={formatCurrency(
                    hasDateFilter
                      ? purchaseSummary?.totalPurchases || 0
                      : purchaseSummary?.todayPurchases || 0
                  )}
                  subtitle={`${hasDateFilter ? purchaseSummary?.count || 0 : purchaseSummary?.todayCount || 0} purchases`}
                  icon={ShoppingCart}
                  theme="indigo"
                />
                <StatCard
                  href="/expenses"
                  title={hasDateFilter ? 'Range Expense' : 'Today Expense'}
                  value={formatCurrency(
                    hasDateFilter ? expenseSummary?.totalExpenses || 0 : expenseSummary?.todayExpenses || 0
                  )}
                  subtitle={`${hasDateFilter ? expenseSummary?.totalCount || 0 : expenseSummary?.todayCount || 0} entries`}
                  icon={Receipt}
                  theme="rose"
                />
              </>
            )}
          </div>
        </section>

        {/* Daily Activity */}
        {!isStaff && (
        <section className="space-y-3 sm:space-y-4">
          <SectionHeading
            title={hasDateFilter ? 'Activity in Range' : "Today's Activity"}
            description="Purchases, returns, expenses, and other income"
            accent="bg-gradient-to-b from-orange-400 to-rose-500"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
            <StatCard
              href="/purchases"
              title={hasDateFilter ? 'Range Purchase' : 'Today Purchase'}
              value={formatCurrency(
                hasDateFilter
                  ? purchaseSummary?.totalPurchases || 0
                  : purchaseSummary?.todayPurchases || 0
              )}
              subtitle={`${hasDateFilter ? purchaseSummary?.count || 0 : purchaseSummary?.todayCount || 0} purchases`}
              icon={ShoppingCart}
              theme="indigo"
            />
            <StatCard
              href="/sales/returns"
              title={hasDateFilter ? 'Range Sale Return' : 'Sale Return'}
              value={formatCurrency(
                hasDateFilter ? saleReturnSummary?.totalAmount || 0 : saleReturnSummary?.todayAmount || 0
              )}
              subtitle={
                hasDateFilter
                  ? `${saleReturnSummary?.totalReturns || 0} returns`
                  : `${saleReturnSummary?.todayReturns || 0} returns today`
              }
              icon={Undo2}
              theme="orange"
            />
            <StatCard
              href="/purchases/returns"
              title={hasDateFilter ? 'Range Purchase Return' : 'Purchase Return'}
              value={formatCurrency(
                hasDateFilter
                  ? purchaseReturnSummary?.totalAmount || 0
                  : purchaseReturnSummary?.todayAmount || 0
              )}
              subtitle={
                hasDateFilter
                  ? `${purchaseReturnSummary?.totalReturns || 0} returns`
                  : `${purchaseReturnSummary?.todayReturns || 0} returns today`
              }
              icon={RotateCcw}
              theme="purple"
            />
            <StatCard
              href="/expenses"
              title={hasDateFilter ? 'Range Expense' : 'Today Expense'}
              value={formatCurrency(
                hasDateFilter ? expenseSummary?.totalExpenses || 0 : expenseSummary?.todayExpenses || 0
              )}
              subtitle={`${hasDateFilter ? expenseSummary?.totalCount || 0 : expenseSummary?.todayCount || 0} entries`}
              icon={Receipt}
              theme="rose"
            />
            <StatCard
              href="/other-income"
              title={hasDateFilter ? 'Range Other Income' : 'Today Other Income'}
              value={formatCurrency(
                hasDateFilter ? otherIncomeSummary?.totalIncome || 0 : otherIncomeSummary?.todayIncome || 0
              )}
              subtitle={`${hasDateFilter ? otherIncomeSummary?.totalCount || 0 : otherIncomeSummary?.todayCount || 0} entries`}
              icon={BadgeDollarSign}
              theme="emerald"
            />
          </div>
        </section>
        )}

        {/* Cash Flow */}
        {!isStaff && (
        <section className="space-y-3 sm:space-y-4">
          <SectionHeading
            title="Cash Flow"
            description="Cash position, receivables, and payables"
            accent="bg-gradient-to-b from-sky-400 to-indigo-600"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <Link href="/dashboard" className="block group">
              <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-5 text-white shadow-xl shadow-blue-300/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-sky-100">Cash in Hand</p>
                    <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
                      {formatCurrency(cashInHand?.cashInHand || 0)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                    <Banknote className="h-5 w-5" />
                  </div>
                </div>
                <div className="relative mt-4 flex flex-wrap gap-3">
                  <span className="rounded-full bg-emerald-400/25 px-3 py-1 text-xs font-medium text-emerald-100">
                    In: {formatCurrency(cashInHand?.totalCashIn || 0)}
                  </span>
                  <span className="rounded-full bg-rose-400/25 px-3 py-1 text-xs font-medium text-rose-100">
                    Out: {formatCurrency(cashInHand?.totalCashOut || 0)}
                  </span>
                </div>
              </div>
            </Link>

            <StatCard
              href="/receivables"
              title="Customer Receivables"
              value={formatCurrency(customerSummary?.totalReceivables || 0)}
              subtitle={`From ${customerSummary?.customersWithCredit || 0} customers`}
              icon={Users}
              theme="orange"
            />
            <StatCard
              href="/payables"
              title="Supplier Payables"
              value={formatCurrency(supplierSummary?.totalPayables || 0)}
              subtitle={`To ${supplierSummary?.suppliersWithCredit || 0} suppliers`}
              icon={Wallet}
              theme="rose"
            />
          </div>
        </section>
        )}

        {/* Charts */}
        <section className={cn('grid grid-cols-1 gap-4 sm:gap-6', !isStaff && 'xl:grid-cols-3')}>
          {!isStaff && (
          <ColorCard
            className="xl:col-span-2 shadow-indigo-100/50"
            title={hasDateFilter ? 'Sales Trend (Selected Range)' : 'Sales Trend (Last 7 Days)'}
            headerClassName="bg-gradient-to-r from-indigo-50 via-violet-50 to-fuchsia-50 border-indigo-100/50 text-indigo-900"
          >
              {salesTrend.length > 0 ? (
                <div className="h-[240px] sm:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#a855f7" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: '#6366f1' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 12, fill: '#6366f1' }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Sales']}
                        labelFormatter={(label) => `Day: ${label}`}
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #c7d2fe',
                          background: 'linear-gradient(135deg, #eef2ff, #faf5ff)',
                          boxShadow: '0 8px 16px -4px rgb(99 102 241 / 0.2)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#6366f1"
                        strokeWidth={3}
                        fill="url(#salesGradient)"
                        dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[240px] sm:h-[300px] text-indigo-300 text-sm">
                  No sales data available
                </div>
              )}
          </ColorCard>
          )}

          <ColorCard
            className={cn('shadow-fuchsia-100/50', isStaff && 'max-w-xl')}
            title="Stock by Category"
            headerClassName="bg-gradient-to-r from-fuchsia-50 via-pink-50 to-rose-50 border-fuchsia-100/50 text-fuchsia-900"
          >
              {categoryData.some((d) => d.value > 0) ? (
                <div className="h-[180px] sm:h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #fbcfe8',
                          background: 'linear-gradient(135deg, #fdf2f8, #faf5ff)',
                          boxShadow: '0 8px 16px -4px rgb(236 72 153 / 0.2)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[180px] sm:h-[200px] text-fuchsia-300 text-sm">
                  No stock data available
                </div>
              )}
              <div className="space-y-2.5 mt-4">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-indigo-50 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                    <span className="truncate font-medium text-indigo-900">Phones</span>
                  </div>
                  <span className="font-semibold text-indigo-700 text-right shrink-0 text-xs sm:text-sm">
                    {stockSummary?.phones?.available || 0} units (
                    {formatCurrency(stockSummary?.phones?.value || 0)})
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-pink-50 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3 h-3 rounded-full bg-pink-500 shrink-0" />
                    <span className="truncate font-medium text-pink-900">Accessories</span>
                  </div>
                  <span className="font-semibold text-pink-700 text-right shrink-0 text-xs sm:text-sm">
                    {stockSummary?.accessories?.totalQuantity || 0} units (
                    {formatCurrency(stockSummary?.accessories?.value || 0)})
                  </span>
                </div>
              </div>
          </ColorCard>
        </section>

        {/* Low Stock */}
        <ColorCard
          className="shadow-amber-100/50"
          title="Low Stock Alert"
          headerClassName="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-amber-100/60 text-amber-900"
        >
          <div className="flex items-center gap-2 -mt-2 mb-4 sm:hidden">
            <span className="rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 p-2 shadow-md shadow-amber-300/40">
              <AlertTriangle className="w-4 h-4 text-white" />
            </span>
            <span className="text-sm font-medium text-amber-800">Items running low</span>
          </div>
            {lowStock.length === 0 ? (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 py-8 text-center">
                <p className="text-sm font-medium text-emerald-700">All good — no low stock items</p>
                <p className="text-xs text-emerald-600/70 mt-1">Your inventory looks healthy</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {lowStock.slice(0, 5).map((item, index) => (
                  <div
                    key={item._id}
                    className={cn(
                      'flex items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl ring-1',
                      index % 2 === 0
                        ? 'bg-gradient-to-r from-amber-50 to-orange-50 ring-amber-100'
                        : 'bg-gradient-to-r from-orange-50 to-rose-50 ring-orange-100'
                    )}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                      <p className="text-sm text-slate-500 truncate">{item.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="inline-flex items-center justify-center min-w-[2.5rem] rounded-xl bg-gradient-to-br from-orange-500 to-red-500 px-3 py-1 text-lg font-bold text-white shadow-md shadow-orange-300/40">
                        {item.quantity || 0}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">in stock</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </ColorCard>
      </div>
    </MainLayout>
  );
}
