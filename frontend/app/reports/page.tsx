'use client';

import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import {
  BarChart3,
  Calendar as CalendarIcon,
  FileText,
  Loader2,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import moment from 'moment';
import {
  expensesApi,
  otherIncomeApi,
  productsApi,
  purchasesApi,
  salesApi,
} from '@/lib/api';
import { paginatedParams } from '@/lib/pagination';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/constant';
import {
  getLineItemBrand,
  getLineItemCategory,
  getLineItemModel,
  getLineItemProductName,
} from '@/lib/line-items';
import { useToast } from '@/hooks/use-toast';
import {
  ColorCard,
  DayBookTypeBadge,
  ExportCsvButton,
  REPORT_GRADIENT,
  reportBtnPrimary,
  SalesPageHero,
  STAT_GRID_CLASS,
  SummaryStat,
  ViewToggle,
} from '@/components/reports/reports-ui';

type GroupBy = 'daily' | 'weekly' | 'monthly' | 'yearly';
type ReportsView = 'report' | 'daybook';
type ReportField =
  | 'sales'
  | 'sales-paid'
  | 'sales-due'
  | 'sales-profit'
  | 'product-profit'
  | 'purchases'
  | 'purchase-paid'
  | 'purchase-due'
  | 'expenses'
  | 'other-income'
  | 'stock-quantity'
  | 'stock-value';

interface ReportRow {
  period: string;
  total: number;
  count: number;
}

interface ProductProfitRow {
  key: string;
  productName: string;
  brand: string;
  model: string;
  category: string;
  quantity: number;
  salesAmount: number;
  costAmount: number;
  profit: number;
}

type DayBookRowType = 'Sale' | 'Purchase' | 'Expense' | 'Other Income';

interface DayBookRow {
  type: DayBookRowType;
  timestamp: number;
  time: string;
  party: string;
  amount: number;
  paid: number;
  due: number;
  profit: number;
}

const reportFields: Array<{
  value: ReportField;
  label: string;
  api: 'sales' | 'purchases' | 'expenses' | 'other-income' | 'products';
  kind: 'currency' | 'number';
}> = [
  { value: 'sales', label: 'Total Sales', api: 'sales', kind: 'currency' },
  { value: 'sales-paid', label: 'Sales Paid Amount', api: 'sales', kind: 'currency' },
  { value: 'sales-due', label: 'Sales Due Amount', api: 'sales', kind: 'currency' },
  { value: 'sales-profit', label: 'Sales Profit / Loss', api: 'sales', kind: 'currency' },
  { value: 'product-profit', label: 'Product Profit', api: 'sales', kind: 'currency' },
  { value: 'purchases', label: 'Total Purchases', api: 'purchases', kind: 'currency' },
  { value: 'purchase-paid', label: 'Purchase Paid Amount', api: 'purchases', kind: 'currency' },
  { value: 'purchase-due', label: 'Purchase Due Amount', api: 'purchases', kind: 'currency' },
  { value: 'expenses', label: 'Expenses', api: 'expenses', kind: 'currency' },
  { value: 'other-income', label: 'Other Income', api: 'other-income', kind: 'currency' },
  { value: 'stock-quantity', label: 'Stock Quantity', api: 'products', kind: 'number' },
  { value: 'stock-value', label: 'Stock Value', api: 'products', kind: 'currency' },
];

const startOfCurrentMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

const today = () => new Date().toISOString().split('T')[0];

const toIsoDateString = (date: Date) => date.toISOString().split('T')[0];

const getRecordDate = (record: any, field: ReportField) => {
  if (field === 'stock-quantity' || field === 'stock-value') {
    return record.purchaseDate || record.createdAt;
  }

  return record.date || record.createdAt;
};

const getLocalMoment = (value: string | undefined) => {
  if (!value) return null;

  // If the backend sends UTC/offset timestamps, preserve the offset then convert to local.
  // If it sends a naive timestamp (no offset), Moment treats it as local already.
  const hasOffset = /[zZ]|[+\-]\d{2}:\d{2}$/.test(value);
  const m = hasOffset ? moment.parseZone(value).local() : moment(value).local();

  if (!m.isValid()) return null;
  return m;
};

const formatTime = (value: string | undefined) => {
  const m = getLocalMoment(value);
  if (!m) return '-';
  return m.format('hh:mm A');
};

const getTimestamp = (value: string | undefined) => {
  const m = getLocalMoment(value);
  if (!m) return 0;
  return m.valueOf();
};

const getSaleProfit = (sale: any) => {
  return (sale.items || []).reduce((sum: number, item: any) => {
    const purchasePrice = item.product?.purchasePrice || 0;
    const salePrice = item.price || 0;
    return sum + (salePrice - purchasePrice) * (item.quantity || 1);
  }, 0);
};

const buildProductProfitRows = (sales: any[]): ProductProfitRow[] => {
  const groups = new Map<string, ProductProfitRow>();

  for (const sale of sales) {
    for (const item of sale.items || []) {
      const productId =
        typeof item.product === 'object' && item.product?._id
          ? String(item.product._id)
          : String(item.product || '');
      const key = item.imei ? `${productId}:${item.imei}` : productId || getLineItemProductName(item);

      const qty = item.quantity || 1;
      const salePrice = item.price || 0;
      const purchasePrice = item.product?.purchasePrice ?? 0;
      const lineSales = salePrice * qty;
      const lineCost = purchasePrice * qty;
      const lineProfit = lineSales - lineCost;

      const existing = groups.get(key);
      if (existing) {
        existing.quantity += qty;
        existing.salesAmount += lineSales;
        existing.costAmount += lineCost;
        existing.profit += lineProfit;
      } else {
        groups.set(key, {
          key,
          productName: getLineItemProductName(item),
          brand: getLineItemBrand(item),
          model: getLineItemModel(item),
          category: getLineItemCategory(item),
          quantity: qty,
          salesAmount: lineSales,
          costAmount: lineCost,
          profit: lineProfit,
        });
      }
    }
  }

  return Array.from(groups.values()).sort((a, b) => b.profit - a.profit);
};

const getWeekNumber = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear =
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(date.getFullYear(), 0, 1)) /
    86400000;

  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

const getPeriodKey = (dateValue: string, groupBy: GroupBy) => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 'No Date';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (groupBy === 'daily') {
    return `${year}-${month}-${day}`;
  }

  if (groupBy === 'weekly') {
    return `${year} Week ${String(getWeekNumber(date)).padStart(2, '0')}`;
  }

  if (groupBy === 'monthly') {
    return `${year}-${month}`;
  }

  return String(year);
};

const getValueForField = (record: any, field: ReportField) => {
  if (field === 'sales') {
    return record.amount || 0;
  }

  if (field === 'sales-paid') {
    return record.paid || 0;
  }

  if (field === 'sales-due') {
    return (record.amount || 0) - (record.paid || 0);
  }

  if (field === 'sales-profit') {
    return (record.items || []).reduce((sum: number, item: any) => {
      const purchasePrice = item.product?.purchasePrice || 0;
      const salePrice = item.price || 0;

      return sum + (salePrice - purchasePrice) * (item.quantity || 1);
    }, 0);
  }

  if (field === 'purchases' || field === 'expenses' || field === 'other-income') {
    return record.amount || 0;
  }

  if (field === 'purchase-paid') {
    return record.paid || 0;
  }

  if (field === 'purchase-due') {
    return record.balance ?? (record.amount || 0) - (record.paid || 0);
  }

  if (field === 'stock-quantity') {
    return record.quantity || 0;
  }

  if (field === 'stock-value') {
    return (record.purchasePrice || record.lastPurchasePrice || 0) * (record.quantity || 0);
  }

  return 0;
};

const formatReportValue = (value: number, field: ReportField) => {
  const config = reportFields.find((item) => item.value === field);

  if (config?.kind === 'number') {
    return value.toLocaleString();
  }

  return formatCurrency(value);
};

const buildReportRows = (records: any[], field: ReportField, groupBy: GroupBy): ReportRow[] => {
  const groups = records.reduce<Record<string, ReportRow>>((acc, record) => {
    const recordDate = getRecordDate(record, field);
    const period = recordDate ? getPeriodKey(recordDate, groupBy) : 'No Date';

    if (!acc[period]) {
      acc[period] = { period, total: 0, count: 0 };
    }

    acc[period].total += getValueForField(record, field);
    acc[period].count += 1;

    return acc;
  }, {});

  return Object.values(groups).sort((a, b) => a.period.localeCompare(b.period));
};

const isWithinDateRange = (record: any, field: ReportField, fromDate: string, toDate: string) => {
  const recordDate = getRecordDate(record, field);

  if (!recordDate) {
    return false;
  }

  const date = new Date(recordDate);
  const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
  const to = toDate ? new Date(`${toDate}T23:59:59`) : null;

  return (!from || date >= from) && (!to || date <= to);
};

export default function ReportsPage() {
  const { toast } = useToast();
  const [view, setView] = useState<ReportsView>('report');
  const [reportField, setReportField] = useState<ReportField>('sales');
  const [groupBy, setGroupBy] = useState<GroupBy>('monthly');
  const [fromDate, setFromDate] = useState(startOfCurrentMonth());
  const [toDate, setToDate] = useState(today());
  const [fromPickerOpen, setFromPickerOpen] = useState(false);
  const [toPickerOpen, setToPickerOpen] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [generatedField, setGeneratedField] = useState<ReportField>('sales');
  const [generatedGroupBy, setGeneratedGroupBy] = useState<GroupBy>('monthly');
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [dayBookDate, setDayBookDate] = useState<string>(today());
  const [dayBookPickerOpen, setDayBookPickerOpen] = useState(false);
  const [dayBookRows, setDayBookRows] = useState<DayBookRow[]>([]);
  const [hasGeneratedDayBook, setHasGeneratedDayBook] = useState(false);

  const selectedField = reportFields.find((field) => field.value === reportField) || reportFields[0];
  const generatedFieldConfig =
    reportFields.find((field) => field.value === generatedField) || reportFields[0];

  const reportRows = useMemo(
    () =>
      generatedField === 'product-profit'
        ? []
        : buildReportRows(records, generatedField, generatedGroupBy),
    [records, generatedField, generatedGroupBy]
  );

  const productProfitRows = useMemo(
    () => (generatedField === 'product-profit' ? buildProductProfitRows(records) : []),
    [records, generatedField]
  );

  const reportTotal =
    generatedField === 'product-profit'
      ? productProfitRows.reduce((sum, row) => sum + row.profit, 0)
      : reportRows.reduce((sum, row) => sum + row.total, 0);
  const reportCount =
    generatedField === 'product-profit'
      ? productProfitRows.reduce((sum, row) => sum + row.quantity, 0)
      : reportRows.reduce((sum, row) => sum + row.count, 0);
  const averagePerPeriod =
    generatedField === 'product-profit'
      ? productProfitRows.length > 0
        ? reportTotal / productProfitRows.length
        : 0
      : reportRows.length > 0
        ? reportTotal / reportRows.length
        : 0;

  const productSalesTotal = productProfitRows.reduce((sum, row) => sum + row.salesAmount, 0);
  const productCostTotal = productProfitRows.reduce((sum, row) => sum + row.costAmount, 0);

  const dayBookSummary = useMemo(() => {
    const sales = dayBookRows.filter((row) => row.type === 'Sale');
    const purchases = dayBookRows.filter((row) => row.type === 'Purchase');
    const expenses = dayBookRows.filter((row) => row.type === 'Expense');
    const otherIncome = dayBookRows.filter((row) => row.type === 'Other Income');

    const sum = (rows: DayBookRow[], key: keyof DayBookRow) =>
      rows.reduce((acc, row) => acc + (Number(row[key]) || 0), 0);

    const salesTotal = sum(sales, 'amount');
    const salesPaid = sum(sales, 'paid');
    const salesDue = sum(sales, 'due');
    const salesProfit = sum(sales, 'profit');

    const purchasesTotal = sum(purchases, 'amount');
    const purchasePaid = sum(purchases, 'paid');
    const purchaseDue = sum(purchases, 'due');

    const expensesTotal = sum(expenses, 'amount');
    const otherIncomeTotal = sum(otherIncome, 'amount');

    const netProfit = salesProfit + otherIncomeTotal - expensesTotal;

    return {
      salesTotal,
      salesPaid,
      salesDue,
      salesProfit,
      purchasesTotal,
      purchasePaid,
      purchaseDue,
      expensesTotal,
      otherIncomeTotal,
      netProfit,
      totalRows: dayBookRows.length,
    };
  }, [dayBookRows]);

  const fetchReportData = async () => {
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      toast({
        title: 'Invalid date range',
        description: 'From date cannot be after to date',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const params: Record<string, string> = { ...paginatedParams(5000) };

      if (fromDate) {
        params.startDate = moment(fromDate, 'YYYY-MM-DD').startOf('day').toISOString();
      }

      if (toDate) {
        params.endDate = moment(toDate, 'YYYY-MM-DD').endOf('day').toISOString();
      }

      let response;

      if (selectedField.api === 'sales') {
        response = await salesApi.getAll(params);
      } else if (selectedField.api === 'purchases') {
        response = await purchasesApi.getAll(params);
      } else if (selectedField.api === 'expenses') {
        response = await expensesApi.getAll(params);
      } else if (selectedField.api === 'other-income') {
        response = await otherIncomeApi.getAll(params);
      } else {
        response = await productsApi.getAll(paginatedParams(5000));
      }

      if (response.success && response.data) {
        const statusFilteredRecords =
          selectedField.api === 'sales' || selectedField.api === 'purchases'
            ? response.data.filter((record: any) => record.status !== 'cancelled')
            : response.data;
        const activeRecords =
          selectedField.api === 'products'
            ? statusFilteredRecords.filter((record: any) =>
                isWithinDateRange(record, reportField, fromDate, toDate)
              )
            : statusFilteredRecords;

        setRecords(activeRecords);
        setGeneratedField(reportField);
        setGeneratedGroupBy(groupBy);
        setHasGenerated(true);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDayBookData = async () => {
    if (!dayBookDate) {
      toast({
        title: 'Select a date',
        description: 'Please select a date for the Day Book.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const dayStart = moment(dayBookDate, 'YYYY-MM-DD').startOf('day');
      const dayEnd = moment(dayBookDate, 'YYYY-MM-DD').endOf('day');
      const params: Record<string, string> = {
        ...paginatedParams(5000),
        // Send absolute instants (UTC) for correct local-day filtering on backend.
        startDate: dayStart.toISOString(),
        endDate: dayEnd.toISOString(),
      };

      const [salesRes, purchasesRes, expensesRes, otherIncomeRes] = await Promise.all([
        salesApi.getAll(params),
        purchasesApi.getAll(params),
        expensesApi.getAll(params),
        otherIncomeApi.getAll(params),
      ]);

      const sales =
        salesRes?.success && Array.isArray(salesRes.data)
          ? salesRes.data.filter((record: any) => record.status !== 'cancelled')
          : [];
      const purchases =
        purchasesRes?.success && Array.isArray(purchasesRes.data)
          ? purchasesRes.data.filter((record: any) => record.status !== 'cancelled')
          : [];
      const expenses =
        expensesRes?.success && Array.isArray(expensesRes.data) ? expensesRes.data : [];
      const otherIncome =
        otherIncomeRes?.success && Array.isArray(otherIncomeRes.data) ? otherIncomeRes.data : [];

      const rows: DayBookRow[] = [
        ...sales.map((sale: any) => {
          const amount = Number(sale.amount) || 0;
          const paid = Number(sale.paid) || 0;
          const due = amount - paid;
          const profit = Number(getSaleProfit(sale)) || 0;
          const party =
            sale.customer?.name || sale.customerName || (sale.isWalkIn ? 'Walk-in' : '-') || '-';

          return {
            type: 'Sale' as const,
            timestamp: getTimestamp(sale.date || sale.createdAt),
            time: formatTime(sale.date || sale.createdAt),
            party,
            amount,
            paid,
            due,
            profit,
          };
        }),
        ...purchases.map((purchase: any) => {
          const amount = Number(purchase.amount) || 0;
          const paid = Number(purchase.paid) || 0;
          const due = Number(purchase.balance ?? amount - paid) || 0;
          const party = purchase.supplier?.name || purchase.supplierName || '-';

          return {
            type: 'Purchase' as const,
            timestamp: getTimestamp(purchase.date || purchase.createdAt),
            time: formatTime(purchase.date || purchase.createdAt),
            party,
            amount,
            paid,
            due,
            profit: 0,
          };
        }),
        ...expenses.map((expense: any) => {
          const amount = Number(expense.amount) || 0;
          const timeSource = expense.createdAt || expense.date;
          return {
            type: 'Expense' as const,
            timestamp: getTimestamp(timeSource),
            time: formatTime(timeSource),
            party: expense.category || expense.title || expense.notes || '-',
            amount,
            paid: amount,
            due: 0,
            profit: 0,
          };
        }),
        ...otherIncome.map((income: any) => {
          const amount = Number(income.amount) || 0;
          const timeSource = income.createdAt || income.date;
          return {
            type: 'Other Income' as const,
            timestamp: getTimestamp(timeSource),
            time: formatTime(timeSource),
            party: income.source || income.category || income.notes || '-',
            amount,
            paid: amount,
            due: 0,
            profit: 0,
          };
        }),
      ].sort((a, b) => a.timestamp - b.timestamp);

      setDayBookRows(rows);
      setHasGeneratedDayBook(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load Day Book',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (generatedField === 'product-profit') {
      const csvRows = [
        ['Product', 'Brand', 'Model', 'Category', 'Qty Sold', 'Sales', 'Cost', 'Profit'],
        ...productProfitRows.map((row) => [
          row.productName,
          row.brand,
          row.model,
          row.category,
          String(row.quantity),
          String(row.salesAmount),
          String(row.costAmount),
          String(row.profit),
        ]),
      ];
      const csv = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `product-profit-report.csv`;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    const csvRows = [
      ['Period', generatedFieldConfig.label, 'Records'],
      ...reportRows.map((row) => [
        row.period,
        String(row.total),
        String(row.count),
      ]),
    ];
    const csv = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${generatedField}-${generatedGroupBy}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title="Reports"
          description="Generate reports by field, or open Day Book for a single day summary"
          badge="Analytics"
          gradient={REPORT_GRADIENT}
          actions={
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <ViewToggle view={view} onViewChange={setView} />
              {view === 'report' && (
                <ExportCsvButton onClick={exportCsv} disabled={!hasGenerated || loading} />
              )}
            </div>
          }
        />

        {view === 'report' ? (
          <ColorCard
            title="Report Filters"
            headerClassName="bg-gradient-to-r from-slate-50 to-zinc-50 border-slate-100/50 text-slate-900"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-600">Report Field</Label>
                <Select
                  value={reportField}
                  onValueChange={(value) => setReportField(value as ReportField)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportFields.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Group By</Label>
                <Select
                  value={groupBy}
                  onValueChange={(value) => setGroupBy(value as GroupBy)}
                  disabled={reportField === 'product-profit'}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                {reportField === 'product-profit' && (
                  <p className="text-xs text-slate-500">Grouped by product (model & category)</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">From Date</Label>
                <Popover open={fromPickerOpen} onOpenChange={setFromPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal rounded-xl',
                        !fromDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                      {fromDate
                        ? format(new Date(`${fromDate}T00:00:00`), 'PPP')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                    <Calendar
                      mode="single"
                      selected={fromDate ? new Date(`${fromDate}T00:00:00`) : undefined}
                      onSelect={(date) => {
                        if (!date) return;
                        setFromDate(toIsoDateString(date));
                        setFromPickerOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">To Date</Label>
                <Popover open={toPickerOpen} onOpenChange={setToPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal rounded-xl',
                        !toDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                      {toDate ? format(new Date(`${toDate}T00:00:00`), 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                    <Calendar
                      mode="single"
                      selected={toDate ? new Date(`${toDate}T00:00:00`) : undefined}
                      onSelect={(date) => {
                        if (!date) return;
                        setToDate(toIsoDateString(date));
                        setToPickerOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-end">
                <Button
                  className={cn('w-full', reportBtnPrimary)}
                  onClick={fetchReportData}
                  disabled={loading}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Generate Report
                </Button>
              </div>
            </div>
          </ColorCard>
        ) : (
          <ColorCard
            title="Day Book Filters"
            headerClassName="bg-gradient-to-r from-zinc-50 to-slate-50 border-zinc-100/50 text-zinc-900"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-slate-600">Date</Label>
                <Popover open={dayBookPickerOpen} onOpenChange={setDayBookPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal rounded-xl',
                        !dayBookDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                      {dayBookDate
                        ? format(new Date(`${dayBookDate}T00:00:00`), 'PPP')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                    <Calendar
                      mode="single"
                      selected={dayBookDate ? new Date(`${dayBookDate}T00:00:00`) : undefined}
                      onSelect={(date) => {
                        if (!date) return;
                        setDayBookDate(toIsoDateString(date));
                        setDayBookPickerOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Quick select</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-slate-200"
                    onClick={() => setDayBookDate(today())}
                    disabled={loading}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-slate-200"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 1);
                      setDayBookDate(toIsoDateString(d));
                    }}
                    disabled={loading}
                  >
                    Yesterday
                  </Button>
                </div>
              </div>
              <div>
                <Button
                  className={cn('w-full', reportBtnPrimary)}
                  onClick={fetchDayBookData}
                  disabled={loading}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Load Day Book
                </Button>
              </div>
            </div>
          </ColorCard>
        )}

        {view === 'report' ? (
          <div className={STAT_GRID_CLASS}>
            <SummaryStat
              label="Selected Field"
              value={generatedFieldConfig.label}
              icon={FileText}
              theme="bg-gradient-to-br from-slate-50 to-zinc-100 text-slate-900 ring-1 ring-slate-100"
            />
            <SummaryStat
              label={generatedField === 'product-profit' ? 'Total Profit' : 'Report Total'}
              value={hasGenerated ? formatReportValue(reportTotal, generatedField) : '-'}
              icon={BarChart3}
              theme={
                (generatedField === 'sales-profit' || generatedField === 'product-profit') &&
                reportTotal < 0
                  ? 'bg-gradient-to-br from-rose-50 to-red-100 text-rose-900 ring-1 ring-rose-100'
                  : 'bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-900 ring-1 ring-emerald-100'
              }
            />
            <SummaryStat
              label={generatedField === 'product-profit' ? 'Products' : 'Average Per Period'}
              value={
                hasGenerated
                  ? generatedField === 'product-profit'
                    ? String(productProfitRows.length)
                    : formatReportValue(averagePerPeriod, generatedField)
                  : '-'
              }
              icon={TrendingUp}
              theme="bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-900 ring-1 ring-indigo-100"
            />
          </div>
        ) : (
          <div className={STAT_GRID_CLASS}>
            <SummaryStat
              label="Sales Total"
              value={hasGeneratedDayBook ? formatCurrency(dayBookSummary.salesTotal) : '-'}
              icon={TrendingUp}
              theme="bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-900 ring-1 ring-emerald-100"
            />
            <SummaryStat
              label="Sales Profit"
              value={hasGeneratedDayBook ? formatCurrency(dayBookSummary.salesProfit) : '-'}
              icon={Wallet}
              theme={
                dayBookSummary.salesProfit < 0
                  ? 'bg-gradient-to-br from-rose-50 to-red-100 text-rose-900 ring-1 ring-rose-100'
                  : 'bg-gradient-to-br from-teal-50 to-cyan-100 text-teal-900 ring-1 ring-teal-100'
              }
            />
            <SummaryStat
              label="Expenses / Other"
              value={
                hasGeneratedDayBook
                  ? formatCurrency(dayBookSummary.expensesTotal + dayBookSummary.otherIncomeTotal)
                  : '-'
              }
              icon={Receipt}
              theme="bg-gradient-to-br from-amber-50 to-orange-100 text-amber-900 ring-1 ring-amber-100"
            />
            <SummaryStat
              label="Net Profit / Loss"
              value={hasGeneratedDayBook ? formatCurrency(dayBookSummary.netProfit) : '-'}
              icon={TrendingDown}
              theme={
                dayBookSummary.netProfit < 0
                  ? 'bg-gradient-to-br from-rose-50 to-red-100 text-rose-900 ring-1 ring-rose-100'
                  : 'bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-900 ring-1 ring-indigo-100'
              }
            />
          </div>
        )}

        {view === 'report' && hasGenerated && (
          <p className="text-sm text-slate-500 px-1">
            {generatedField === 'product-profit'
              ? `${productProfitRows.length} products · ${reportCount} units sold`
              : `${reportCount} records included`}
          </p>
        )}

        {view === 'report' ? (
          <ColorCard
            title={
              hasGenerated
                ? generatedField === 'product-profit'
                  ? `${generatedFieldConfig.label} Report`
                  : `${generatedFieldConfig.label} Report (${generatedGroupBy})`
                : 'Generated Report'
            }
            headerClassName="bg-gradient-to-r from-slate-50 via-zinc-50 to-gray-50 border-slate-100/50 text-slate-900"
          >
            {!hasGenerated ? (
              <div className="text-center text-slate-500 py-12 rounded-2xl bg-slate-50/50 ring-1 ring-slate-100">
                Select a field, date range, and grouping, then generate the report.
              </div>
            ) : generatedField === 'product-profit' && productProfitRows.length === 0 ? (
              <div className="text-center text-slate-500 py-12 rounded-2xl bg-slate-50/50 ring-1 ring-slate-100">
                No product sales found for the selected filters.
              </div>
            ) : generatedField === 'product-profit' ? (
              <>
                <div className="space-y-3 lg:hidden">
                  {productProfitRows.map((row) => (
                    <div
                      key={row.key}
                      className="rounded-2xl border border-slate-100/80 bg-gradient-to-br from-white to-slate-50/40 p-4 shadow-sm"
                    >
                      <p className="font-semibold text-slate-900">{row.productName}</p>
                      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600">
                        <span>Brand: {row.brand || '—'}</span>
                        <span>Model: {row.model || '—'}</span>
                        <span className="col-span-2">Category: {row.category || '—'}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-xs text-slate-500">Qty sold</p>
                          <p className="font-bold">{row.quantity}</p>
                        </div>
                        <div className="rounded-xl bg-indigo-50 px-3 py-2">
                          <p className="text-xs text-indigo-600">Sales</p>
                          <p className="font-bold text-indigo-800">{formatCurrency(row.salesAmount)}</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 px-3 py-2">
                          <p className="text-xs text-amber-700">Cost</p>
                          <p className="font-bold text-amber-900">{formatCurrency(row.costAmount)}</p>
                        </div>
                        <div
                          className={cn(
                            'rounded-xl px-3 py-2',
                            row.profit < 0 ? 'bg-rose-50' : 'bg-emerald-50'
                          )}
                        >
                          <p className={cn('text-xs', row.profit < 0 ? 'text-rose-600' : 'text-emerald-600')}>
                            Profit
                          </p>
                          <p
                            className={cn(
                              'font-bold',
                              row.profit < 0 ? 'text-rose-800' : 'text-emerald-800'
                            )}
                          >
                            {formatCurrency(row.profit)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden lg:block overflow-x-auto rounded-xl ring-1 ring-slate-100/70">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-50 to-zinc-50/80">
                        <TableHead>Product</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Sales</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productProfitRows.map((row) => (
                        <TableRow key={row.key} className="hover:bg-slate-50/30">
                          <TableCell className="font-medium text-slate-900">{row.productName}</TableCell>
                          <TableCell>{row.brand || '—'}</TableCell>
                          <TableCell>{row.model || '—'}</TableCell>
                          <TableCell>{row.category || '—'}</TableCell>
                          <TableCell className="text-right">{row.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.salesAmount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.costAmount)}</TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-semibold',
                              row.profit < 0 ? 'text-rose-700' : 'text-emerald-700'
                            )}
                          >
                            {formatCurrency(row.profit)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {productProfitRows.length > 0 && (
                        <TableRow className="bg-slate-50/80 font-semibold">
                          <TableCell colSpan={4}>Total</TableCell>
                          <TableCell className="text-right">{reportCount}</TableCell>
                          <TableCell className="text-right">{formatCurrency(productSalesTotal)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(productCostTotal)}</TableCell>
                          <TableCell
                            className={cn(
                              'text-right',
                              reportTotal < 0 ? 'text-rose-700' : 'text-emerald-700'
                            )}
                          >
                            {formatCurrency(reportTotal)}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : reportRows.length === 0 ? (
              <div className="text-center text-slate-500 py-12 rounded-2xl bg-slate-50/50 ring-1 ring-slate-100">
                No records found for the selected filters.
              </div>
            ) : (
              <>
                <div className="space-y-3 lg:hidden">
                  {reportRows.map((row) => (
                    <div
                      key={row.period}
                      className="rounded-2xl border border-slate-100/80 bg-gradient-to-br from-white to-slate-50/40 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{row.period}</p>
                          <p className="text-xs text-slate-500 mt-1">{row.count} records</p>
                        </div>
                        <span
                          className={cn(
                            'shrink-0 rounded-xl px-2.5 py-1 text-sm font-bold ring-1',
                            generatedField === 'sales-profit' && row.total < 0
                              ? 'bg-rose-50 text-rose-700 ring-rose-100'
                              : 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                          )}
                        >
                          {formatReportValue(row.total, generatedField)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden lg:block overflow-x-auto rounded-xl ring-1 ring-slate-100/70">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-50 to-zinc-50/80">
                        <TableHead>Period</TableHead>
                        <TableHead>{generatedFieldConfig.label}</TableHead>
                        <TableHead>Records</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportRows.map((row) => (
                        <TableRow key={row.period} className="hover:bg-slate-50/30">
                          <TableCell className="font-medium text-slate-900">{row.period}</TableCell>
                          <TableCell
                            className={cn(
                              'font-semibold',
                              generatedField === 'sales-profit' && row.total < 0
                                ? 'text-rose-700'
                                : 'text-slate-800'
                            )}
                          >
                            {formatReportValue(row.total, generatedField)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="rounded-lg border-slate-200">
                              {row.count}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </ColorCard>
        ) : (
          <ColorCard
            title={
              hasGeneratedDayBook
                ? `Day Book — ${dayBookDate ? format(new Date(`${dayBookDate}T00:00:00`), 'PPP') : ''}`
                : 'Day Book Entries'
            }
            headerClassName="bg-gradient-to-r from-zinc-50 via-slate-50 to-gray-50 border-zinc-100/50 text-zinc-900"
          >
            {!hasGeneratedDayBook ? (
              <div className="text-center text-slate-500 py-12 rounded-2xl bg-slate-50/50 ring-1 ring-slate-100">
                Pick a date and click &quot;Load Day Book&quot;.
              </div>
            ) : dayBookRows.length === 0 ? (
              <div className="text-center text-slate-500 py-12 rounded-2xl bg-slate-50/50 ring-1 ring-slate-100">
                No activity found for this date.
              </div>
            ) : (
              <>
                <div className="space-y-3 lg:hidden">
                  {dayBookRows.map((row, idx) => (
                    <div
                      key={`${row.type}-${row.time}-${idx}`}
                      className="rounded-2xl border border-zinc-100/80 bg-gradient-to-br from-white to-zinc-50/40 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900">{row.time}</span>
                            <DayBookTypeBadge type={row.type} />
                          </div>
                          <p className="text-sm text-slate-600 mt-1 truncate">{row.party}</p>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-slate-900">
                          {formatCurrency(row.amount)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                        <div>
                          <p className="text-slate-400">Paid</p>
                          <p className="font-medium text-slate-700">{formatCurrency(row.paid)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Due</p>
                          <p className="font-medium text-slate-700">{formatCurrency(row.due)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Profit</p>
                          <p
                            className={cn(
                              'font-medium',
                              row.profit < 0
                                ? 'text-rose-700'
                                : row.profit > 0
                                  ? 'text-emerald-700'
                                  : 'text-slate-700'
                            )}
                          >
                            {formatCurrency(row.profit)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden lg:block overflow-x-auto rounded-xl ring-1 ring-zinc-100/70">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-zinc-50 to-slate-50/80">
                        <TableHead>Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Party / Note</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Due</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dayBookRows.map((row, idx) => (
                        <TableRow key={`${row.type}-${row.time}-${idx}`} className="hover:bg-zinc-50/30">
                          <TableCell className="font-medium text-slate-900">{row.time}</TableCell>
                          <TableCell>
                            <DayBookTypeBadge type={row.type} />
                          </TableCell>
                          <TableCell className="max-w-[420px] truncate text-slate-600">
                            {row.party}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(row.amount)}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(row.paid)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.due)}</TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-semibold',
                              row.profit < 0
                                ? 'text-rose-700'
                                : row.profit > 0
                                  ? 'text-emerald-700'
                                  : ''
                            )}
                          >
                            {formatCurrency(row.profit)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </ColorCard>
        )}
      </div>
    </MainLayout>
  );
}