'use client';

import { useState, useCallback } from 'react';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { ListPagination } from '@/components/ui/list-pagination';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  Loader2,
  Search,
  Wallet,
  Clock,
  AlertTriangle,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { purchasesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/constant';
import {
  ColorCard,
  formatAccountingDate,
  getAgingBadge,
  PAYABLE_GRADIENT,
  SalesPageHero,
  STAT_GRID_CLASS,
  SummaryStat,
} from '@/components/accounting/accounting-ui';
import { AgingPaymentDialog } from '@/components/accounting/aging-payment-dialog';

interface Payable {
  _id: string;
  supplier: string;
  supplierId: string;
  purchase: string;
  date: string;
  amount: number;
  paid: number;
  due: number;
  dueDate: string;
  aging: string;
  daysDiff: number;
}

interface Summary {
  totalPayables: number;
  totalPurchased: number;
  aging0to30: number;
  aging30to60: number;
  aging60plus: number;
  totalSuppliers: number;
}

export default function PayablesPage() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPayables = useCallback(async (params: Record<string, string>) => {
    const response: any = await purchasesApi.getPayables(params);
    if (response.success && response.summary) {
      setSummary(response.summary);
    }
    return {
      success: response.success,
      data: response.data,
      pagination: response.pagination,
    };
  }, []);

  const {
    items: payables,
    loading,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    search,
    setSearch,
    refetch,
  } = usePaginatedList<Payable>(fetchPayables, { sortBy: 'date', sortOrder: 'desc' });

  const openPayment = (item: Payable) => {
    setSelectedPayable(item);
    setPaymentAmount(item.due.toString());
    setShowPaymentDialog(true);
  };

  const handleMakePayment = async () => {
    if (!selectedPayable || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > selectedPayable.due) {
      toast({
        title: 'Invalid Amount',
        description: `Amount must be between 1 and ${formatCurrency(selectedPayable.due)}`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await purchasesApi.updatePayment(selectedPayable._id, amount);
      toast({ title: 'Success', description: 'Payment made successfully' });
      setShowPaymentDialog(false);
      setSelectedPayable(null);
      setPaymentAmount('');
      await refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to make payment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title="Payables"
          description="Track pending payments to suppliers"
          badge="Money Out"
          gradient={PAYABLE_GRADIENT}
          actions={
            <Link href="/receivables">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-xl bg-white/15 text-white hover:bg-white/25 border-0 w-full sm:w-auto"
              >
                Receivables
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          }
        />

        <div className={STAT_GRID_CLASS}>
          <SummaryStat
            label="Total Payables"
            value={summary ? formatCurrency(summary.totalPayables) : '-'}
            icon={Wallet}
            theme="bg-gradient-to-br from-rose-50 to-red-100 text-rose-900 ring-1 ring-rose-100"
          />
          <SummaryStat
            label="0-30 Days"
            value={summary ? formatCurrency(summary.aging0to30) : '-'}
            icon={Clock}
            theme="bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-900 ring-1 ring-emerald-100"
          />
          <SummaryStat
            label="30-60 Days"
            value={summary ? formatCurrency(summary.aging30to60) : '-'}
            icon={Clock}
            theme="bg-gradient-to-br from-amber-50 to-orange-100 text-amber-900 ring-1 ring-amber-100"
          />
          <SummaryStat
            label="60+ Days"
            value={summary ? formatCurrency(summary.aging60plus) : '-'}
            icon={AlertTriangle}
            theme="bg-gradient-to-br from-red-50 to-rose-100 text-red-900 ring-1 ring-red-100"
          />
          <SummaryStat
            label="Suppliers"
            value={summary ? String(summary.totalSuppliers) : '-'}
            icon={Building2}
            theme="bg-gradient-to-br from-pink-50 to-rose-100 text-pink-900 ring-1 ring-pink-100"
          />
        </div>

        <ColorCard
          title={`Payables Details${pagination.total ? ` (${pagination.total})` : ''}`}
          headerClassName="bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 border-rose-100/50 text-rose-900"
        >
          <div className="mb-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by supplier or purchase..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
            </div>
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {payables.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-rose-100/80 bg-gradient-to-br from-white to-rose-50/30 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-rose-900">{item.supplier}</p>
                        <p className="text-sm text-slate-600">{item.purchase}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Due {formatAccountingDate(item.dueDate)}
                        </p>
                      </div>
                      {getAgingBadge(item.aging)}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-500">Total</p>
                        <p className="font-semibold">{formatCurrency(item.amount)}</p>
                      </div>
                      <div className="rounded-xl bg-emerald-50 px-3 py-2">
                        <p className="text-xs text-emerald-600">Paid</p>
                        <p className="font-semibold text-emerald-800">{formatCurrency(item.paid)}</p>
                      </div>
                      <div className="rounded-xl bg-rose-50 px-3 py-2">
                        <p className="text-xs text-rose-600">Due</p>
                        <p className="font-bold text-rose-800">{formatCurrency(item.due)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => openPayment(item)}
                        className="rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 border-0"
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Pay
                      </Button>
                    </div>
                  </div>
                ))}
                {payables.length === 0 && (
                  <p className="text-center py-8 text-slate-500">No payables found</p>
                )}
              </div>

              <div className="hidden lg:block overflow-x-auto rounded-xl ring-1 ring-rose-100/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-red-50 to-rose-50/80">
                      <TableHead>Supplier</TableHead>
                      <TableHead>Purchase #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Aging</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payables.map((item) => (
                      <TableRow key={item._id} className="hover:bg-rose-50/20">
                        <TableCell className="font-medium text-rose-900">
                          {item.supplier}
                        </TableCell>
                        <TableCell>{item.purchase}</TableCell>
                        <TableCell>{formatAccountingDate(item.date)}</TableCell>
                        <TableCell>{formatCurrency(item.amount)}</TableCell>
                        <TableCell className="text-emerald-700">{formatCurrency(item.paid)}</TableCell>
                        <TableCell className="font-semibold text-rose-600">
                          {formatCurrency(item.due)}
                        </TableCell>
                        <TableCell>{formatAccountingDate(item.dueDate)}</TableCell>
                        <TableCell>{getAgingBadge(item.aging)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => openPayment(item)}
                            className="rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 border-0"
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Pay
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {payables.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                          No payables found
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

        <AgingPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          variant="pay"
          partyLabel="Supplier"
          partyName={selectedPayable?.supplier || ''}
          referenceLabel="Purchase #"
          referenceValue={selectedPayable?.purchase || ''}
          totalAmount={selectedPayable?.amount || 0}
          paidAmount={selectedPayable?.paid || 0}
          dueAmount={selectedPayable?.due || 0}
          amount={paymentAmount}
          onAmountChange={setPaymentAmount}
          onSave={handleMakePayment}
          saving={saving}
        />
      </div>
    </MainLayout>
  );
}
