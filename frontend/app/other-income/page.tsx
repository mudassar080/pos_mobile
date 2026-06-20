'use client';

import { useState, useEffect } from 'react';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { ListPagination } from '@/components/ui/list-pagination';
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
import { Loader2, Search, TrendingUp, Hash, Tag, ArrowRight } from 'lucide-react';
import { otherIncomeApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/constant';
import moment from 'moment';
import {
  ColorCard,
  formatAccountingDate,
  getIncomeCategoryBadge,
  INCOME_GRADIENT,
  NewIncomeButton,
  SalesPageHero,
  STAT_GRID_CLASS,
  SummaryStat,
} from '@/components/other-income/other-income-ui';
import {
  IncomeFormDialog,
  type IncomeFormData,
} from '@/components/other-income/income-form-dialog';

const defaultForm = (): IncomeFormData => ({
  category: '',
  amount: '',
  date: moment().format('YYYY-MM-DD'),
  paymentMode: 'Cash',
  description: '',
});

export default function OtherIncomePage() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [formData, setFormData] = useState<IncomeFormData>(defaultForm());

  const {
    items: incomes,
    loading,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    search,
    setSearch,
    refetch,
  } = usePaginatedList((params) => otherIncomeApi.getAll(params), {
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const fetchSummary = async () => {
    try {
      const summaryRes = await otherIncomeApi.getSummary();
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleOpenAdd = () => {
    setFormData(defaultForm());
    setShowAddIncome(true);
  };

  const handleSaveIncome = async () => {
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
      await otherIncomeApi.create({
        ...formData,
        amount: parseFloat(formData.amount),
        date: moment(formData.date, 'YYYY-MM-DD').startOf('day').toDate(),
      });
      toast({ title: 'Success', description: 'Income added successfully' });
      setShowAddIncome(false);
      setFormData(defaultForm());
      await refetch();
      await fetchSummary();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save income',
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
          title="Other Income"
          description="Track additional income from services, commissions, and resale"
          badge="Money In"
          gradient={INCOME_GRADIENT}
          actions={
            <Link href="/expenses">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-xl bg-white/15 text-white hover:bg-white/25 border-0 w-full sm:w-auto"
              >
                Expenses
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          }
        />

        <div className={STAT_GRID_CLASS}>
          <SummaryStat
            label="This Month"
            value={summary ? formatCurrency(summary.totalIncome || 0) : '-'}
            icon={TrendingUp}
            theme="bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-900 ring-1 ring-emerald-100"
          />
          <SummaryStat
            label="Transactions"
            value={summary ? String(summary.totalCount || 0) : '-'}
            icon={Hash}
            theme="bg-gradient-to-br from-teal-50 to-cyan-100 text-teal-900 ring-1 ring-teal-100"
          />
          <SummaryStat
            label="Top Category"
            value={summary ? topCategory?._id || '—' : '-'}
            icon={Tag}
            theme="bg-gradient-to-br from-green-50 to-emerald-100 text-green-900 ring-1 ring-green-100"
          />
          <SummaryStat
            label="Top Amount"
            value={summary ? formatCurrency(topCategory?.total || 0) : '-'}
            icon={TrendingUp}
            theme="bg-gradient-to-br from-lime-50 to-green-100 text-lime-900 ring-1 ring-lime-100"
          />
        </div>

        {summary?.byCategory?.length > 0 && (
          <ColorCard
            title="Income by Category"
            headerClassName="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100/50 text-emerald-900"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {summary.byCategory.map((cat: any) => (
                <div
                  key={cat._id}
                  className="flex items-center justify-between rounded-xl bg-gradient-to-br from-white to-emerald-50/50 ring-1 ring-emerald-100 px-4 py-3"
                >
                  <Badge className={getIncomeCategoryBadge(cat._id)}>{cat._id}</Badge>
                  <span className="font-bold text-emerald-800">{formatCurrency(cat.total)}</span>
                </div>
              ))}
            </div>
          </ColorCard>
        )}

        <ColorCard
          title={`Recent Income${pagination.total ? ` (${pagination.total})` : ''}`}
          headerClassName="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-emerald-100/50 text-emerald-900"
        >
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search category, description, payment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
              />
            </div>
            <NewIncomeButton onClick={handleOpenAdd} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            </div>
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {incomes.map((income) => (
                  <div
                    key={income._id}
                    className="rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-white to-emerald-50/30 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Badge className={getIncomeCategoryBadge(income.category)}>
                          {income.category}
                        </Badge>
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                          {income.description || 'No description'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatAccountingDate(income.date)} · {income.paymentMode}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-xl bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
                        {formatCurrency(income.amount)}
                      </span>
                    </div>
                  </div>
                ))}
                {incomes.length === 0 && (
                  <p className="text-center py-8 text-slate-500">No income found</p>
                )}
              </div>

              <div className="hidden lg:block overflow-x-auto rounded-xl ring-1 ring-emerald-100/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-emerald-50 to-green-50/80">
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Payment Mode</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomes.map((income) => (
                      <TableRow key={income._id} className="hover:bg-emerald-50/20">
                        <TableCell>{formatAccountingDate(income.date)}</TableCell>
                        <TableCell>
                          <Badge className={getIncomeCategoryBadge(income.category)}>
                            {income.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-xs truncate">
                          {income.description || '—'}
                        </TableCell>
                        <TableCell>
                          <span className="rounded-lg bg-slate-50 px-2 py-1 text-sm">
                            {income.paymentMode}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-700">
                          {formatCurrency(income.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {incomes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                          No income found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <ListPagination pagination={pagination} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
            </>
          )}
        </ColorCard>

        <IncomeFormDialog
          open={showAddIncome}
          onOpenChange={setShowAddIncome}
          form={formData}
          onFormChange={setFormData}
          onSave={handleSaveIncome}
          saving={saving}
        />
      </div>
    </MainLayout>
  );
}
