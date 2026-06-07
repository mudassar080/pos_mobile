'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Save, Ban, Info, DollarSign, Wallet, CreditCard } from 'lucide-react';
import { salesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, PAYMENT_MODES } from '@/utils/constant';
import {
  ColorCard,
  formatSaleDate,
  getStatusBadge,
  SalesPageHero,
  SummaryStat,
} from '@/components/sales/sales-ui';

export default function SaleEditPage() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.id as string;
  const { toast } = useToast();
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<string>('Cash');

  const fetchSale = async () => {
    try {
      setLoading(true);
      const response = await salesApi.getById(saleId);
      if (response.success && response.data) {
        const data = response.data;
        if (data.status === 'cancelled') {
          toast({ title: 'Cannot Edit', description: 'This sale is cancelled', variant: 'destructive' });
          router.push(`/sales/${saleId}`);
          return;
        }
        if (data.status === 'paid') {
          toast({ title: 'Already Paid', description: 'This sale is fully paid', variant: 'destructive' });
          router.push(`/sales/${saleId}`);
          return;
        }
        setSale(data);
        setPaymentMode(data.paymentMode === 'Mixed' ? 'Cash' : data.paymentMode || 'Cash');
      } else {
        toast({ title: 'Error', description: 'Sale not found', variant: 'destructive' });
        router.push('/sales');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load sale', variant: 'destructive' });
      router.push('/sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (saleId) fetchSale();
  }, [saleId]);

  const balance = sale ? Math.max(0, (sale.amount || 0) - (sale.paid || 0)) : 0;

  const handleSavePayment = async () => {
    if (!sale) return;

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount',
        variant: 'destructive',
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: 'Invalid Amount',
        description: `Amount cannot exceed balance of ${formatCurrency(balance)}`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await salesApi.updatePayment(saleId, {
        amount,
        paymentMode,
      });
      if (response.success) {
        toast({ title: 'Success', description: 'Payment recorded successfully' });
        router.push(`/sales/${saleId}`);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update payment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSale = async () => {
    if (!sale) return;
    const confirmed = window.confirm(
      `Cancel sale ${sale.invoiceNumber}? Products will be restored to available stock.`
    );
    if (!confirmed) return;

    setCancelling(true);
    try {
      const response = await salesApi.cancel(saleId);
      if (response.success) {
        toast({ title: 'Sale Cancelled', description: 'Sale cancelled and products restored' });
        router.push('/sales');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel sale',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      </MainLayout>
    );
  }

  if (!sale) return null;

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title={`Edit ${sale.invoiceNumber}`}
          description="Record payment or cancel this sale"
          badge="Payment Update"
          gradient="from-violet-600 via-purple-600 to-fuchsia-700"
          backHref={`/sales/${saleId}`}
        />

        <Alert className="rounded-2xl border-indigo-200 bg-indigo-50/80">
          <Info className="h-4 w-4 text-indigo-600" />
          <AlertTitle className="text-indigo-900">Limited edit scope</AlertTitle>
          <AlertDescription className="text-indigo-700">
            Sale line items cannot be changed after creation. You can record additional payments or
            cancel the sale to restore products.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SummaryStat
            label="Total"
            value={formatCurrency(sale.amount)}
            icon={DollarSign}
            theme="bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-900 ring-1 ring-emerald-100"
          />
          <SummaryStat
            label="Paid"
            value={formatCurrency(sale.paid)}
            icon={CreditCard}
            theme="bg-gradient-to-br from-violet-50 to-purple-100 text-violet-900 ring-1 ring-violet-100"
          />
          <SummaryStat
            label="Balance Due"
            value={formatCurrency(balance)}
            icon={Wallet}
            theme="bg-gradient-to-br from-orange-50 to-amber-100 text-orange-900 ring-1 ring-orange-100"
          />
          <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-fuchsia-50 to-pink-100 ring-1 ring-fuchsia-100 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-600/70">Status</p>
            <div className="mt-2">{getStatusBadge(sale.status)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <ColorCard
            title="Record Payment"
            headerClassName="bg-gradient-to-r from-violet-50 to-fuchsia-50 border-violet-100/50 text-violet-900"
            className="lg:col-span-1 h-fit"
          >
            <div className="space-y-4">
              <div>
                <Label>Payment Amount</Label>
                <Input
                  type="number"
                  min="0"
                  max={balance}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Max ${formatCurrency(balance)}`}
                  className="rounded-xl mt-1.5"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Outstanding balance: {formatCurrency(balance)}
                </p>
              </div>
              <div>
                <Label>Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger className="rounded-xl mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSavePayment}
                disabled={saving || !paymentAmount}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 border-0 shadow-lg shadow-violet-300/30"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Save Payment
              </Button>
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancelSale}
                  disabled={cancelling}
                  className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                >
                  {cancelling ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4 mr-2" />
                  )}
                  Cancel Sale
                </Button>
              </div>
            </div>
          </ColorCard>

          <ColorCard
            title="Sale Items (Read-only)"
            headerClassName="bg-gradient-to-r from-slate-50 to-indigo-50/50 border-slate-200/50 text-slate-800"
            className="lg:col-span-2"
          >
            <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm">
              <span className="text-slate-500">Customer: </span>
              <span className="font-semibold text-slate-900">{sale.customerName}</span>
              <span className="text-slate-400 mx-2">·</span>
              <span className="text-slate-500">Date: </span>
              <span className="font-medium">{formatSaleDate(sale.date)}</span>
            </div>
            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200/70">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead>Product</TableHead>
                    <TableHead>IMEI / Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items?.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.imei ? item.imei : `Qty: ${item.quantity}`}
                      </TableCell>
                      <TableCell>{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-end">
              <Link href={`/sales/${saleId}`}>
                <Button variant="outline" className="rounded-xl">
                  View Full Details
                </Button>
              </Link>
            </div>
          </ColorCard>
        </div>
      </div>
    </MainLayout>
  );
}
