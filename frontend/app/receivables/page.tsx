'use client';

import { useState, useEffect } from 'react';
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
  Users,
  ArrowRight,
} from 'lucide-react';
import { salesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/constant';
import {
  ColorCard,
  formatAccountingDate,
  getAgingBadge,
  RECEIVABLE_GRADIENT,
  SalesPageHero,
  SummaryStat,
} from '@/components/accounting/accounting-ui';
import { AgingPaymentDialog } from '@/components/accounting/aging-payment-dialog';

interface Receivable {
  _id: string;
  customer: string;
  customerId: string;
  invoice: string;
  date: string;
  amount: number;
  paid: number;
  due: number;
  dueDate: string;
  aging: string;
  daysDiff: number;
}

interface Summary {
  totalReceivables: number;
  aging0to30: number;
  aging30to60: number;
  aging60plus: number;
  totalCustomers: number;
}

export default function ReceivablesPage() {
  const { toast } = useToast();
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchReceivables = async () => {
    try {
      setLoading(true);
      const response: any = await salesApi.getReceivables();
      if (response.success) {
        setReceivables(response.data || []);
        setSummary(response.summary || null);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch receivables',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, []);

  const filteredReceivables = receivables.filter(
    (r) =>
      r.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.invoice?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openPayment = (item: Receivable) => {
    setSelectedReceivable(item);
    setPaymentAmount(item.due.toString());
    setShowPaymentDialog(true);
  };

  const handleReceivePayment = async () => {
    if (!selectedReceivable || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > selectedReceivable.due) {
      toast({
        title: 'Invalid Amount',
        description: `Amount must be between 1 and ${formatCurrency(selectedReceivable.due)}`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await salesApi.updatePayment(selectedReceivable._id, { amount });
      toast({ title: 'Success', description: 'Payment received successfully' });
      setShowPaymentDialog(false);
      setSelectedReceivable(null);
      setPaymentAmount('');
      fetchReceivables();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to receive payment',
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
          title="Receivables"
          description="Track pending payments from customers"
          badge="Money In"
          gradient={RECEIVABLE_GRADIENT}
          actions={
            <Link href="/payables">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-xl bg-white/15 text-white hover:bg-white/25 border-0 w-full sm:w-auto"
              >
                Payables
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <SummaryStat
            label="Total Receivables"
            value={loading ? '-' : formatCurrency(summary?.totalReceivables || 0)}
            icon={Wallet}
            theme="bg-gradient-to-br from-orange-50 to-amber-100 text-orange-900 ring-1 ring-orange-100"
          />
          <SummaryStat
            label="0-30 Days"
            value={loading ? '-' : formatCurrency(summary?.aging0to30 || 0)}
            icon={Clock}
            theme="bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-900 ring-1 ring-emerald-100"
          />
          <SummaryStat
            label="30-60 Days"
            value={loading ? '-' : formatCurrency(summary?.aging30to60 || 0)}
            icon={Clock}
            theme="bg-gradient-to-br from-amber-50 to-orange-100 text-amber-900 ring-1 ring-amber-100"
          />
          <SummaryStat
            label="60+ Days"
            value={loading ? '-' : formatCurrency(summary?.aging60plus || 0)}
            icon={AlertTriangle}
            theme="bg-gradient-to-br from-rose-50 to-red-100 text-rose-900 ring-1 ring-rose-100"
          />
          <SummaryStat
            label="Customers"
            value={loading ? '-' : String(summary?.totalCustomers || 0)}
            icon={Users}
            theme="bg-gradient-to-br from-amber-50 to-yellow-100 text-amber-900 ring-1 ring-amber-100"
          />
        </div>

        <ColorCard
          title="Receivables Details"
          headerClassName="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-orange-100/50 text-orange-900"
        >
          <div className="mb-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by customer or invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
            </div>
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {filteredReceivables.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-orange-100/80 bg-gradient-to-br from-white to-orange-50/30 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-orange-900">{item.customer}</p>
                        <p className="text-sm text-slate-600">{item.invoice}</p>
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
                      <div className="rounded-xl bg-orange-50 px-3 py-2">
                        <p className="text-xs text-orange-600">Due</p>
                        <p className="font-bold text-orange-800">{formatCurrency(item.due)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => openPayment(item)}
                        className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-0"
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Receive
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredReceivables.length === 0 && (
                  <p className="text-center py-8 text-slate-500">No receivables found</p>
                )}
              </div>

              <div className="hidden lg:block overflow-x-auto rounded-xl ring-1 ring-orange-100/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-amber-50 to-orange-50/80">
                      <TableHead>Customer</TableHead>
                      <TableHead>Invoice</TableHead>
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
                    {filteredReceivables.map((item) => (
                      <TableRow key={item._id} className="hover:bg-orange-50/20">
                        <TableCell className="font-medium text-orange-900">
                          {item.customer}
                        </TableCell>
                        <TableCell>{item.invoice}</TableCell>
                        <TableCell>{formatAccountingDate(item.date)}</TableCell>
                        <TableCell>{formatCurrency(item.amount)}</TableCell>
                        <TableCell className="text-emerald-700">{formatCurrency(item.paid)}</TableCell>
                        <TableCell className="font-semibold text-orange-600">
                          {formatCurrency(item.due)}
                        </TableCell>
                        <TableCell>{formatAccountingDate(item.dueDate)}</TableCell>
                        <TableCell>{getAgingBadge(item.aging)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => openPayment(item)}
                            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-0"
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Receive
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredReceivables.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                          No receivables found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </ColorCard>

        <AgingPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          variant="receive"
          partyLabel="Customer"
          partyName={selectedReceivable?.customer || ''}
          referenceLabel="Invoice"
          referenceValue={selectedReceivable?.invoice || ''}
          totalAmount={selectedReceivable?.amount || 0}
          paidAmount={selectedReceivable?.paid || 0}
          dueAmount={selectedReceivable?.due || 0}
          amount={paymentAmount}
          onAmountChange={setPaymentAmount}
          onSave={handleReceivePayment}
          saving={saving}
        />
      </div>
    </MainLayout>
  );
}
