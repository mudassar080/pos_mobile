'use client';

import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { BookOpen, Calendar as CalendarIcon, Download, FileText, Loader2, TrendingUp } from 'lucide-react';
import moment from 'moment';
import {
  expensesApi,
  otherIncomeApi,
  productsApi,
  purchasesApi,
  salesApi,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/constant';
import { useToast } from '@/hooks/use-toast';

type GroupBy = 'daily' | 'weekly' | 'monthly' | 'yearly';
type ReportsView = 'report' | 'daybook';
type ReportField =
  | 'sales'
  | 'sales-paid'
  | 'sales-due'
  | 'sales-profit'
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
    () => buildReportRows(records, generatedField, generatedGroupBy),
    [records, generatedField, generatedGroupBy]
  );

  const reportTotal = reportRows.reduce((sum, row) => sum + row.total, 0);
  const reportCount = reportRows.reduce((sum, row) => sum + row.count, 0);
  const averagePerPeriod = reportRows.length > 0 ? reportTotal / reportRows.length : 0;

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
      const params: Record<string, string> = { limit: '5000' };

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
        response = await productsApi.getAll({
          limit: '5000',
        });
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
        limit: '5000',
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
      <div className="space-y-6">
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
              <p className="text-slate-600">
                Generate reports by field, or open Day Book for a single day summary.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={view === 'report' ? 'default' : 'outline'}
                onClick={() => setView('report')}
              >
                Reports
              </Button>
              <Button
                variant={view === 'daybook' ? 'default' : 'outline'}
                onClick={() => setView('daybook')}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Day Book
              </Button>
            </div>
          </div>
        </div>

        {view === 'report' ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Report Filters</CardTitle>
                <Button variant="outline" onClick={exportCsv} disabled={!hasGenerated || loading}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label>Report Field</Label>
                  <Select
                    value={reportField}
                    onValueChange={(value) => setReportField(value as ReportField)}
                  >
                    <SelectTrigger>
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
                <div>
                  <Label>Group By</Label>
                  <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>From Date</Label>
                  <Popover open={fromPickerOpen} onOpenChange={setFromPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !fromDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fromDate
                          ? format(new Date(`${fromDate}T00:00:00`), 'PPP')
                          : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                <div>
                  <Label>To Date</Label>
                  <Popover open={toPickerOpen} onOpenChange={setToPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !toDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {toDate ? format(new Date(`${toDate}T00:00:00`), 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                  <Button className="w-full" onClick={fetchReportData} disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Day Book</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <Label>Date</Label>
                  <Popover open={dayBookPickerOpen} onOpenChange={setDayBookPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !dayBookDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dayBookDate ? format(new Date(`${dayBookDate}T00:00:00`), 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                <div>
                  <Label>Quick select</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setDayBookDate(today())}
                      disabled={loading}
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
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
                  <Button className="w-full" onClick={fetchDayBookData} disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Load Day Book
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {view === 'report' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600">Selected Field</div>
                    <div className="text-xl font-bold">{generatedFieldConfig.label}</div>
                  </div>
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600">Report Total</div>
                    <div
                      className={`text-2xl font-bold ${
                        generatedField === 'sales-profit' && reportTotal < 0
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {formatReportValue(reportTotal, generatedField)}
                    </div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-slate-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-slate-600">Average Per Period</div>
                <div className="text-2xl font-bold">
                  {formatReportValue(averagePerPeriod, generatedField)}
                </div>
                <div className="text-sm text-slate-500 mt-1">{reportCount} records included</div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-slate-600">Sales (Total / Profit)</div>
                <div className="text-xl font-bold">{formatCurrency(dayBookSummary.salesTotal)}</div>
                <div
                  className={cn(
                    'text-sm mt-1 font-medium',
                    dayBookSummary.salesProfit < 0 ? 'text-red-600' : 'text-green-600'
                  )}
                >
                  Profit: {formatCurrency(dayBookSummary.salesProfit)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-slate-600">Expenses / Other Income</div>
                <div className="text-sm mt-1">
                  <span className="font-medium">Expenses:</span> {formatCurrency(dayBookSummary.expensesTotal)}
                </div>
                <div className="text-sm mt-1">
                  <span className="font-medium">Other:</span> {formatCurrency(dayBookSummary.otherIncomeTotal)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-slate-600">Purchases (Total)</div>
                <div className="text-xl font-bold">{formatCurrency(dayBookSummary.purchasesTotal)}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Paid {formatCurrency(dayBookSummary.purchasePaid)} • Due {formatCurrency(dayBookSummary.purchaseDue)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-slate-600">Net Profit / Loss</div>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    dayBookSummary.netProfit < 0 ? 'text-red-600' : 'text-green-600'
                  )}
                >
                  {formatCurrency(dayBookSummary.netProfit)}
                </div>
                <div className="text-xs text-slate-500 mt-1">{dayBookSummary.totalRows} entries</div>
              </CardContent>
            </Card>
          </div>
        )}

        {view === 'report' ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {hasGenerated
                  ? `${generatedFieldConfig.label} Report (${generatedGroupBy})`
                  : 'Generated Report'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasGenerated ? (
                <div className="text-center text-slate-500 py-10">
                  Select a field, date range, and grouping, then generate the report.
                </div>
              ) : reportRows.length === 0 ? (
                <div className="text-center text-slate-500 py-10">
                  No records found for the selected filters.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>{generatedFieldConfig.label}</TableHead>
                      <TableHead>Records</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportRows.map((row) => (
                      <TableRow key={row.period}>
                        <TableCell className="font-medium">{row.period}</TableCell>
                        <TableCell
                          className={
                            generatedField === 'sales-profit' && row.total < 0
                              ? 'font-medium text-red-600'
                              : 'font-medium'
                          }
                        >
                          {formatReportValue(row.total, generatedField)}
                        </TableCell>
                        <TableCell>{row.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {hasGeneratedDayBook
                  ? `Day Book — ${dayBookDate ? format(new Date(`${dayBookDate}T00:00:00`), 'PPP') : ''}`
                  : 'Day Book Entries'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasGeneratedDayBook ? (
                <div className="text-center text-slate-500 py-10">
                  Pick a date and click “Load Day Book”.
                </div>
              ) : dayBookRows.length === 0 ? (
                <div className="text-center text-slate-500 py-10">
                  No activity found for this date.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
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
                      <TableRow key={`${row.type}-${row.time}-${idx}`}>
                        <TableCell className="font-medium">{row.time}</TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell className="max-w-[420px] truncate">{row.party}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.amount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.paid)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.due)}</TableCell>
                        <TableCell
                          className={cn(
                            'text-right font-medium',
                            row.profit < 0 ? 'text-red-600' : row.profit > 0 ? 'text-green-600' : ''
                          )}
                        >
                          {formatCurrency(row.profit)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}