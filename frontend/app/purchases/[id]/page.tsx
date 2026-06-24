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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Pencil, Trash2, Building2, Calendar, CreditCard, FileText } from 'lucide-react';
import { purchasesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { formatCurrency } from '@/utils/constant';
import {
  ProductNameCell,
  LineItemBrandCell,
  LineItemModelCell,
  LineItemCategoryCell,
} from '@/components/line-items/line-item-table-cells';
import {
  ColorCard,
  formatSaleDate,
  getStatusBadge,
  PURCHASE_GRADIENT,
  SalesPageHero,
  STAT_GRID_CLASS,
  SummaryStat,
} from '@/components/purchases/purchases-ui';

export default function PurchaseViewPage() {
  const params = useParams();
  const router = useRouter();
  const purchaseId = params.id as string;
  const { toast } = useToast();
  const { canEdit, canDelete } = usePermissions();
  const [purchase, setPurchase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchPurchase = async () => {
    try {
      setLoading(true);
      const response = await purchasesApi.getById(purchaseId);
      if (response.success && response.data) {
        setPurchase(response.data);
      } else {
        toast({ title: 'Error', description: 'Purchase not found', variant: 'destructive' });
        router.push('/purchases');
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load purchase', variant: 'destructive' });
      router.push('/purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (purchaseId) fetchPurchase();
  }, [purchaseId]);

  const handleDelete = async () => {
    if (!purchase) return;

    setDeleting(true);
    try {
      await purchasesApi.delete(purchase._id);
      toast({
        title: 'Deleted',
        description: `Purchase ${purchase.purchaseNumber} removed and inventory/supplier totals adjusted.`,
      });
      router.push('/purchases');
    } catch (error: any) {
      toast({
        title: 'Could not delete',
        description:
          error?.message ||
          'Remove linked purchase returns first, or cancel the purchase instead.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
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

  if (!purchase) return null;

  const balance = purchase.balance ?? Math.max(0, (purchase.amount || 0) - (purchase.paid || 0));
  const showEdit = canEdit && purchase.status !== 'cancelled';
  const paymentHistory = [...(purchase.paymentHistory || [])].sort(
    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title={purchase.purchaseNumber}
          description={`Purchase from ${purchase.supplierName}`}
          badge={purchase.status === 'cancelled' ? 'Cancelled' : 'Purchase Details'}
          gradient={
            purchase.status === 'cancelled'
              ? 'from-slate-600 via-slate-700 to-slate-800'
              : PURCHASE_GRADIENT
          }
          backHref="/purchases"
          actions={
            showEdit || canDelete ? (
              <>
                {showEdit && (
                  <Link href={`/purchases/${purchaseId}/edit`}>
                    <Button className="rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 border-0 shadow-md">
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Purchase
                    </Button>
                  </Link>
                )}
                {canDelete && (
                  <Button
                    variant="secondary"
                    onClick={() => setShowDeleteDialog(true)}
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
                )}
              </>
            ) : undefined
          }
        />

        <div className={STAT_GRID_CLASS}>
          <SummaryStat
            label="Total Amount"
            value={formatCurrency(purchase.amount)}
            icon={CreditCard}
            theme="bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-900 ring-1 ring-indigo-100"
          />
          <SummaryStat
            label="Paid"
            value={formatCurrency(purchase.paid)}
            icon={CreditCard}
            theme="bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-900 ring-1 ring-emerald-100"
          />
          <SummaryStat
            label="Balance"
            value={formatCurrency(balance)}
            icon={CreditCard}
            theme="bg-gradient-to-br from-rose-50 to-red-100 text-rose-900 ring-1 ring-rose-100"
          />
          <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-100 ring-1 ring-indigo-100 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600/70">Status</p>
            <div className="mt-2">{getStatusBadge(purchase.status)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <ColorCard
            title="Supplier & Details"
            headerClassName="bg-gradient-to-r from-blue-50 to-indigo-50 border-indigo-100/50 text-indigo-900"
            className="lg:col-span-1"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-2 text-white">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Supplier</p>
                  <p className="font-semibold text-slate-900">{purchase.supplierName}</p>
                  {purchase.supplier?.phone && (
                    <p className="text-sm text-slate-600">{purchase.supplier.phone}</p>
                  )}
                  {purchase.supplier?.email && (
                    <p className="text-sm text-slate-600">{purchase.supplier.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-2 text-white">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Date</p>
                  <p className="font-semibold text-slate-900">{formatSaleDate(purchase.date)}</p>
                </div>
              </div>
              {purchase.notes && (
                <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-100">
                  <FileText className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-amber-700">Notes</p>
                    <p className="text-sm text-amber-900">{purchase.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </ColorCard>

          <ColorCard
            title="Purchase Items"
            headerClassName="bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100/50 text-indigo-900"
            className="lg:col-span-2"
          >
            <div className="overflow-x-auto rounded-xl ring-1 ring-indigo-100/70">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50/80">
                    <TableHead>Product</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>IMEI / Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.items?.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <ProductNameCell item={item} showViewButton={false} />
                      </TableCell>
                      <TableCell><LineItemBrandCell item={item} /></TableCell>
                      <TableCell><LineItemModelCell item={item} /></TableCell>
                      <TableCell><LineItemCategoryCell item={item} /></TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.imei ? (
                          <span className="text-indigo-600">{item.imei}</span>
                        ) : (
                          `Qty: ${item.quantity}`
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right font-semibold text-indigo-800">
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

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this purchase?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove <strong>{purchase.purchaseNumber}</strong> from your
                records.
                {purchase.status !== 'cancelled' && (
                  <> Stock and supplier payables will be reversed.</>
                )}{' '}
                You cannot delete a purchase that still has linked purchase returns.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting} className="rounded-xl">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 hover:bg-red-700"
              >
                {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
