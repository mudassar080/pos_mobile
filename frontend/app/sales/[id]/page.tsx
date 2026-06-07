'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Pencil, Trash2, User, Calendar, CreditCard, FileText } from 'lucide-react';
import { salesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/constant';
import {
  ColorCard,
  formatSaleDate,
  getStatusBadge,
  SalesPageHero,
  SummaryStat,
} from '@/components/sales/sales-ui';

export default function SaleViewPage() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.id as string;
  const { toast } = useToast();
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchSale = async () => {
    try {
      setLoading(true);
      const response = await salesApi.getById(saleId);
      if (response.success && response.data) {
        setSale(response.data);
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

  const handleDelete = async () => {
    if (!sale) return;
    const confirmed = window.confirm(
      `Delete sale ${sale.invoiceNumber}? This will restore all linked products.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const response = await salesApi.delete(saleId);
      if (response.success) {
        toast({
          title: 'Sale Deleted',
          description: `${sale.invoiceNumber} deleted successfully`,
        });
        router.push('/sales');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete sale',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      </MainLayout>
    );
  }

  if (!sale) return null;

  const balance = Math.max(0, (sale.amount || 0) - (sale.paid || 0));
  const canEdit = sale.status !== 'cancelled' && sale.status !== 'paid';
  const paymentHistory = [...(sale.paymentHistory || [])].sort(
    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title={sale.invoiceNumber}
          description={`Sale for ${sale.customerName}`}
          badge={sale.status === 'cancelled' ? 'Cancelled' : 'Sale Details'}
          gradient={
            sale.status === 'cancelled'
              ? 'from-slate-600 via-slate-700 to-slate-800'
              : 'from-indigo-600 via-violet-600 to-purple-700'
          }
          backHref="/sales"
          actions={
            <>
              {canEdit && (
                <Link href={`/sales/${saleId}/edit`}>
                  <Button className="rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 border-0 shadow-md">
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Payment
                  </Button>
                </Link>
              )}
              <Button
                variant="secondary"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-500/20 text-white hover:bg-red-500/30 border-0"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SummaryStat
            label="Total Amount"
            value={formatCurrency(sale.amount)}
            icon={CreditCard}
            theme="bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-900 ring-1 ring-emerald-100"
          />
          <SummaryStat
            label="Paid"
            value={formatCurrency(sale.paid)}
            icon={CreditCard}
            theme="bg-gradient-to-br from-violet-50 to-purple-100 text-violet-900 ring-1 ring-violet-100"
          />
          <SummaryStat
            label="Balance"
            value={formatCurrency(balance)}
            icon={CreditCard}
            theme="bg-gradient-to-br from-orange-50 to-amber-100 text-orange-900 ring-1 ring-orange-100"
          />
          <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-indigo-50 to-blue-100 ring-1 ring-indigo-100 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600/70">Status</p>
            <div className="mt-2">{getStatusBadge(sale.status)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <ColorCard
            title="Customer & Payment"
            headerClassName="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-100/50 text-cyan-900"
            className="lg:col-span-1"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                <div className="rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 p-2 text-white">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Customer</p>
                  <p className="font-semibold text-slate-900">{sale.customerName}</p>
                  {sale.customer?.phone && (
                    <p className="text-sm text-slate-600">{sale.customer.phone}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-2 text-white">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Date</p>
                  <p className="font-semibold text-slate-900">{formatSaleDate(sale.date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-2 text-white">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Payment Mode</p>
                  <Badge variant="outline" className="mt-1 rounded-lg">
                    {sale.paymentMode}
                  </Badge>
                </div>
              </div>
              {sale.notes && (
                <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-100">
                  <FileText className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-amber-700">Notes</p>
                    <p className="text-sm text-amber-900">{sale.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </ColorCard>

          <ColorCard
            title="Sale Items"
            headerClassName="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100/50 text-emerald-900"
            className="lg:col-span-2"
          >
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
                        {item.imei ? (
                          <span className="text-indigo-600">{item.imei}</span>
                        ) : (
                          `Qty: ${item.quantity}`
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-700">
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ColorCard>
        </div>

        <ColorCard
          title="Payment History"
          headerClassName="bg-gradient-to-r from-violet-50 to-fuchsia-50 border-violet-100/50 text-violet-900"
        >
          {paymentHistory.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {paymentHistory.map((payment: any, idx: number) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl bg-gradient-to-r from-violet-50/80 to-fuchsia-50/80 p-4 ring-1 ring-violet-100"
                >
                  <div>
                    <p className="font-semibold text-violet-900">
                      {formatCurrency(payment.amount)}{' '}
                      <span className="text-sm font-normal text-violet-600">
                        ({payment.paymentMode || 'Cash'})
                      </span>
                    </p>
                    <p className="text-sm text-slate-500">
                      {payment.note || payment.source || 'Payment'}
                    </p>
                  </div>
                  <span className="text-sm text-slate-500 shrink-0">
                    {payment.date ? formatSaleDate(payment.date) : '-'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-slate-500 text-sm">No payment history available</p>
          )}
        </ColorCard>
      </div>
    </MainLayout>
  );
}
