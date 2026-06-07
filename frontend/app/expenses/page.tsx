'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Search, Receipt, Hash, Tag, ArrowRight } from 'lucide-react';
import { expensesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/constant';
import moment from 'moment';
import {
  ColorCard,
  EXPENSE_GRADIENT,
  formatAccountingDate,
  getCategoryBadge,
  NewExpenseButton,
  SalesPageHero,
  SummaryStat,
} from '@/components/expenses/expenses-ui';
import {
  ExpenseFormDialog,
  type ExpenseFormData,
} from '@/components/expenses/expense-form-dialog';

const defaultForm = (): ExpenseFormData => ({
  category: '',
  amount: '',
  date: moment().format('YYYY-MM-DD'),
  paymentMode: 'Cash',
  description: '',
});

export default function ExpensesPage() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [formData, setFormData] = useState<ExpenseFormData>(defaultForm());

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const [expensesRes, summaryRes] = await Promise.all([
        expensesApi.getAll({ limit: '100', sortOrder: 'desc' }),
        expensesApi.getSummary(),
      ]);
      if (expensesRes.success && expensesRes.data) {
        setExpenses(expensesRes.data);
      }
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch expenses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const filteredExpenses = expenses.filter(
    (e) =>
      e.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.paymentMode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setFormData(defaultForm());
    setShowAddExpense(true);
  };

  const handleSaveExpense = async () => {
    if (!formData.category || !formData.amount) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in category and amount',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await expensesApi.create({
        ...formData,
        amount: parseFloat(formData.amount),
        date: moment(formData.date, 'YYYY-MM-DD').startOf('day').toDate(),
      });
      toast({ title: 'Success', description: 'Expense added successfully' });
      setShowAddExpense(false);
      setFormData(defaultForm());
      fetchExpenses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save expense',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const topCategory = summary?.byCategory?.[0];

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title="Expenses"
          description="Track business expenses and spending by category"
          badge="Money Out"
          gradient={EXPENSE_GRADIENT}
          actions={
            <Link href="/other-income">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-xl bg-white/15 text-white hover:bg-white/25 border-0 w-full sm:w-auto"
              >
                Other Income
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SummaryStat
            label="This Month"
            value={loading ? '-' : formatCurrency(summary?.totalExpenses || 0)}
            icon={Receipt}
            theme="bg-gradient-to-br from-rose-50 to-red-100 text-rose-900 ring-1 ring-rose-100"
          />
          <SummaryStat
            label="Transactions"
            value={loading ? '-' : String(summary?.totalCount || 0)}
            icon={Hash}
            theme="bg-gradient-to-br from-orange-50 to-amber-100 text-orange-900 ring-1 ring-orange-100"
          />
          <SummaryStat
            label="Top Category"
            value={loading ? '-' : topCategory?._id || '—'}
            icon={Tag}
            theme="bg-gradient-to-br from-red-50 to-rose-100 text-red-900 ring-1 ring-red-100"
          />
          <SummaryStat
            label="Top Amount"
            value={loading ? '-' : formatCurrency(topCategory?.total || 0)}
            icon={Receipt}
            theme="bg-gradient-to-br from-amber-50 to-orange-100 text-amber-900 ring-1 ring-amber-100"
          />
        </div>

        {summary?.byCategory?.length > 0 && (
          <ColorCard
            title="Expenses by Category"
            headerClassName="bg-gradient-to-r from-rose-50 to-orange-50 border-rose-100/50 text-rose-900"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {summary.byCategory.map((cat: any) => (
                <div
                  key={cat._id}
                  className="flex items-center justify-between rounded-xl bg-gradient-to-br from-white to-rose-50/50 ring-1 ring-rose-100 px-4 py-3"
                >
                  <Badge className={getCategoryBadge(cat._id)}>{cat._id}</Badge>
                  <span className="font-bold text-rose-800">{formatCurrency(cat.total)}</span>
                </div>
              ))}
            </div>
          </ColorCard>
        )}

        <ColorCard
          title="Recent Expenses"
          headerClassName="bg-gradient-to-r from-red-50 via-rose-50 to-orange-50 border-rose-100/50 text-rose-900"
        >
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search category, description, payment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
              />
            </div>
            <NewExpenseButton onClick={handleOpenAdd} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
            </div>
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {filteredExpenses.map((expense) => (
                  <div
                    key={expense._id}
                    className="rounded-2xl border border-rose-100/80 bg-gradient-to-br from-white to-rose-50/30 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Badge className={getCategoryBadge(expense.category)}>
                          {expense.category}
                        </Badge>
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                          {expense.description || 'No description'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatAccountingDate(expense.date)} · {expense.paymentMode}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-xl bg-rose-50 px-2.5 py-1 text-sm font-bold text-rose-700 ring-1 ring-rose-100">
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                  </div>
                ))}
                {filteredExpenses.length === 0 && (
                  <p className="text-center py-8 text-slate-500">No expenses found</p>
                )}
              </div>

              <div className="hidden lg:block overflow-x-auto rounded-xl ring-1 ring-rose-100/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-rose-50 to-red-50/80">
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Payment Mode</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense._id} className="hover:bg-rose-50/20">
                        <TableCell>{formatAccountingDate(expense.date)}</TableCell>
                        <TableCell>
                          <Badge className={getCategoryBadge(expense.category)}>
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-xs truncate">
                          {expense.description || '—'}
                        </TableCell>
                        <TableCell>
                          <span className="rounded-lg bg-slate-50 px-2 py-1 text-sm">
                            {expense.paymentMode}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-rose-700">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredExpenses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                          No expenses found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </ColorCard>

        <ExpenseFormDialog
          open={showAddExpense}
          onOpenChange={setShowAddExpense}
          form={formData}
          onFormChange={setFormData}
          onSave={handleSaveExpense}
          saving={saving}
        />
      </div>
    </MainLayout>
  );
}
