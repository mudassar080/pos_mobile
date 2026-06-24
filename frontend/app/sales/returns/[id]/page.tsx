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
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, RotateCcw, DollarSign, CalendarDays, FileText } from 'lucide-react';
import { saleReturnsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/constant';
import {
  ProductNameCell,
  LineItemBrandCell,
  LineItemModelCell,
  LineItemCategoryCell,
  LineItemImeiCell,
} from '@/components/line-items/line-item-table-cells';
import {
  ColorCard,
  formatSaleDate,
  getReasonBadge,
  SalesPageHero,
  STAT_GRID_CLASS,
  SummaryStat,
} from '@/components/sales/sales-ui';

export default function SaleReturnViewPage() {
  const params = useParams();
  const router = useRouter();
  const returnId = params.id as string;
  const { toast } = useToast();
  const [saleReturn, setSaleReturn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchReturn = async () => {
    try {
      setLoading(true);
      const response = await saleReturnsApi.getById(returnId);
      if (response.success && response.data) {
        setSaleReturn(response.data);
      } else {
        toast({ title: 'Error', description: 'Sale return not found', variant: 'destructive' });
        router.push('/sales/returns');
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load sale return', variant: 'destructive' });
      router.push('/sales/returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (returnId) fetchReturn();
  }, [returnId]);

  const handleDelete = async () => {
    if (!saleReturn) return;

    setDeleting(true);
    try {
      await saleReturnsApi.delete(saleReturn._id);
      toast({
        title: 'Success',
        description: 'Sale return deleted successfully',
      });
      router.push('/sales/returns');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete sale return',
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
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
        </div>
      </MainLayout>
    );
  }

  if (!saleReturn) return null;

  const costImpact = saleReturn.costImpact ?? 0;

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title={saleReturn.returnNumber}
          description={`Return for invoice ${saleReturn.invoiceNumber}`}
          badge="Return Details"
          gradient="from-orange-600 via-amber-600 to-yellow-600"
          backHref="/sales/returns"
          actions={
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
          }
        />

        <div className={STAT_GRID_CLASS}>
          <SummaryStat
            label="Return Amount"
            value={formatCurrency(saleReturn.amount)}
            icon={DollarSign}
            theme="bg-gradient-to-br from-orange-50 to-amber-100 text-orange-900 ring-1 ring-orange-100"
          />
          <SummaryStat
            label="Profit"
            value={formatCurrency(saleReturn.profit || 0)}
            icon={RotateCcw}
            theme={
              (saleReturn.profit || 0) >= 0
                ? 'bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-900 ring-1 ring-emerald-100'
                : 'bg-gradient-to-br from-red-50 to-rose-100 text-red-900 ring-1 ring-red-100'
            }
          />
          <SummaryStat
            label="Cost Impact"
            value={`${costImpact >= 0 ? 'Profit ' : 'Loss '}${formatCurrency(Math.abs(costImpact))}`}
            icon={DollarSign}
            theme={
              costImpact >= 0
                ? 'bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-900 ring-1 ring-emerald-100'
                : 'bg-gradient-to-br from-red-50 to-rose-100 text-red-900 ring-1 ring-red-100'
            }
          />
          <SummaryStat
            label="Date"
            value={formatSaleDate(saleReturn.date)}
            icon={CalendarDays}
            theme="bg-gradient-to-br from-amber-50 to-yellow-100 text-amber-900 ring-1 ring-amber-100"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <ColorCard
            title="Return Info"
            headerClassName="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100/50 text-orange-900"
            className="lg:col-span-1"
          >
            <div className="space-y-3">
              {[
                { label: 'Invoice', value: saleReturn.invoiceNumber },
                { label: 'Customer', value: saleReturn.customerName },
                { label: 'Refund Method', value: saleReturn.refundMethod },
              ].map((field) => (
                <div key={field.label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{field.label}</p>
                  <p className="font-semibold mt-0.5 text-slate-900">{field.value}</p>
                </div>
              ))}
              <div className="rounded-xl bg-orange-50 p-3 ring-1 ring-orange-100">
                <p className="text-xs text-orange-600">Reason</p>
                <div className="mt-1">{getReasonBadge(saleReturn.reason)}</div>
              </div>
              {saleReturn.notes && (
                <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-100">
                  <FileText className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-amber-700">Notes</p>
                    <p className="text-sm text-amber-900 mt-0.5">{saleReturn.notes}</p>
                  </div>
                </div>
              )}
              {saleReturn.sale && (
                <Link
                  href={`/sales/${typeof saleReturn.sale === 'object' ? saleReturn.sale._id : saleReturn.sale}`}
                  className="block rounded-xl bg-indigo-50 p-3 ring-1 ring-indigo-100 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  View original sale →
                </Link>
              )}
            </div>
          </ColorCard>

          <ColorCard
            title="Items Returned"
            headerClassName="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-100/50 text-amber-900"
            className="lg:col-span-2"
          >
            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200/70">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Product</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>IMEI</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Purchase</TableHead>
                    <TableHead>Sold</TableHead>
                    <TableHead>Return</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="text-right">P/L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saleReturn.items?.map((item: any, idx: number) => {
                    const itemCostImpact = item.costImpact ?? 0;
                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <ProductNameCell item={item} showViewButton={false} />
                        </TableCell>
                        <TableCell><LineItemBrandCell item={item} /></TableCell>
                        <TableCell><LineItemModelCell item={item} /></TableCell>
                        <TableCell><LineItemCategoryCell item={item} /></TableCell>
                        <TableCell><LineItemImeiCell item={item} /></TableCell>
                        <TableCell>
                          {item.condition ? (
                            <Badge variant="outline" className="text-xs rounded-md">
                              {item.condition}
                            </Badge>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(item.purchasePrice ?? 0)}</TableCell>
                        <TableCell>{formatCurrency(item.originalPrice || item.price)}</TableCell>
                        <TableCell>{formatCurrency(item.returnPrice || item.price)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              itemCostImpact >= 0
                                ? 'text-green-600 font-semibold'
                                : 'text-red-600 font-semibold'
                            }
                          >
                            {itemCostImpact >= 0 ? 'Profit ' : 'Loss '}
                            {formatCurrency(Math.abs(itemCostImpact))}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </ColorCard>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Sale Return</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete return{' '}
                <strong>{saleReturn.returnNumber}</strong>? This will reverse stock changes and
                customer balance adjustments.
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
