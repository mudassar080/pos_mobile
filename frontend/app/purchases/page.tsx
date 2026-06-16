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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Loader2,
  Eye,
  Pencil,
  Trash2,
  MoreVertical,
  Search,
  Package,
  DollarSign,
  Wallet,
  CreditCard,
} from 'lucide-react';
import { purchasesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { ListPagination } from '@/components/ui/list-pagination';
import { formatCurrency } from '@/utils/constant';
import {
  ColorCard,
  formatSaleDate,
  formatSaleDateShort,
  getStatusBadge,
  NewPurchaseButton,
  PURCHASE_GRADIENT,
  SalesPageHero,
  SummaryStat,
} from '@/components/purchases/purchases-ui';

export default function PurchasesPage() {
  const { toast } = useToast();
  const { canEdit, canDelete } = usePermissions();
  const [summary, setSummary] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; num: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailsPurchase, setDetailsPurchase] = useState<any | null>(null);

  const {
    items: purchases,
    loading,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    search,
    setSearch,
    refetch,
  } = usePaginatedList((params) => purchasesApi.getAll(params), {
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const fetchSummary = async () => {
    try {
      const response = await purchasesApi.getSummary();
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await purchasesApi.delete(deleteTarget.id);
      toast({
        title: 'Deleted',
        description: `Purchase ${deleteTarget.num} removed and inventory/supplier totals adjusted.`,
      });
      setDeleteTarget(null);
      await refetch();
      await fetchSummary();
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
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title="Purchases"
          description="Manage inventory purchases from suppliers"
          badge="Inventory"
          gradient={PURCHASE_GRADIENT}
          actions={<NewPurchaseButton />}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SummaryStat
            label="Total Purchases"
            value={summary ? String(summary.count || 0) : '-'}
            icon={Package}
            theme="bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-900 ring-1 ring-blue-100"
          />
          <SummaryStat
            label="Total Amount"
            value={summary ? formatCurrency(summary.totalPurchases || 0) : '-'}
            icon={DollarSign}
            theme="bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-900 ring-1 ring-indigo-100"
          />
          <SummaryStat
            label="Paid"
            value={summary ? formatCurrency(summary.totalPaid || 0) : '-'}
            icon={CreditCard}
            theme="bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-900 ring-1 ring-emerald-100"
          />
          <SummaryStat
            label="Outstanding"
            value={summary ? formatCurrency(summary.totalBalance || 0) : '-'}
            icon={Wallet}
            theme="bg-gradient-to-br from-rose-50 to-red-100 text-rose-900 ring-1 ring-rose-100"
          />
        </div>

        <ColorCard
          title="Purchase History"
          headerClassName="bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 border-indigo-100/50 text-indigo-900"
        >
          <div className="mb-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by purchase # or supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {purchases.map((purchase) => {
                  const balance = purchase.balance ?? purchase.amount - purchase.paid;
                  return (
                    <div
                      key={purchase._id}
                      className="rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-white to-blue-50/30 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-indigo-800">{purchase.purchaseNumber}</p>
                          <p className="text-sm text-slate-600 truncate">{purchase.supplierName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatSaleDateShort(purchase.date)}
                          </p>
                        </div>
                        {getStatusBadge(purchase.status)}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-xl bg-indigo-50 px-3 py-2">
                          <p className="text-xs text-indigo-600">Amount</p>
                          <p className="font-bold text-indigo-800">{formatCurrency(purchase.amount)}</p>
                        </div>
                        <div className="rounded-xl bg-rose-50 px-3 py-2">
                          <p className="text-xs text-rose-600">Balance</p>
                          <p className="font-bold text-rose-800">{formatCurrency(balance)}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setDetailsPurchase(purchase)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View details
                            </DropdownMenuItem>
                            {canEdit && purchase.status !== 'cancelled' && (
                              <DropdownMenuItem asChild>
                                <Link href={`/purchases/${purchase._id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit purchase
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onSelect={() =>
                                    setDeleteTarget({ id: purchase._id, num: purchase.purchaseNumber })
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
                {purchases.length === 0 && (
                  <div className="rounded-2xl bg-slate-50 py-10 text-center text-slate-500 text-sm">
                    No purchases found
                  </div>
                )}
              </div>

              <div className="hidden md:block overflow-x-auto rounded-xl ring-1 ring-indigo-100/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50/80 hover:from-blue-50 hover:to-indigo-50/80">
                      <TableHead>Purchase #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase._id} className="hover:bg-indigo-50/20">
                        <TableCell className="font-semibold text-indigo-800">
                          {purchase.purchaseNumber}
                        </TableCell>
                        <TableCell className="text-slate-600">{formatSaleDate(purchase.date)}</TableCell>
                        <TableCell>{purchase.supplierName}</TableCell>
                        <TableCell>{purchase.itemsCount || purchase.items?.length || 0}</TableCell>
                        <TableCell className="font-medium text-indigo-700">
                          {formatCurrency(purchase.amount)}
                        </TableCell>
                        <TableCell className="font-medium text-emerald-700">
                          {formatCurrency(purchase.paid)}
                        </TableCell>
                        <TableCell className="text-red-600 font-semibold">
                          {formatCurrency(purchase.balance || purchase.amount - purchase.paid)}
                        </TableCell>
                        <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => setDetailsPurchase(purchase)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
                                </DropdownMenuItem>
                                {canEdit &&
                                  (purchase.status !== 'cancelled' ? (
                                    <DropdownMenuItem asChild>
                                      <Link href={`/purchases/${purchase._id}/edit`}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit purchase
                                      </Link>
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem disabled>
                                      <Pencil className="mr-2 h-4 w-4 opacity-50" />
                                      Edit (cancelled)
                                    </DropdownMenuItem>
                                  ))}
                                {canDelete && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600"
                                      onSelect={() =>
                                        setDeleteTarget({
                                          id: purchase._id,
                                          num: purchase.purchaseNumber,
                                        })
                                      }
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {purchases.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-slate-500">
                          No purchases found
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

        <Dialog
          open={detailsPurchase !== null}
          onOpenChange={(open) => {
            if (!open) setDetailsPurchase(null);
          }}
        >
          <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            {detailsPurchase ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-indigo-900">
                    Purchase Details — {detailsPurchase.purchaseNumber}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'Supplier', value: detailsPurchase.supplierName },
                      {
                        label: 'Date',
                        value: formatSaleDate(detailsPurchase.date),
                      },
                      {
                        label: 'Total Amount',
                        value: formatCurrency(detailsPurchase.amount),
                        highlight: 'text-indigo-700 font-bold',
                      },
                      { label: 'Status', value: null, badge: detailsPurchase.status },
                    ].map((field) => (
                      <div key={field.label} className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">{field.label}</p>
                        {field.badge ? (
                          <div className="mt-1">{getStatusBadge(field.badge)}</div>
                        ) : (
                          <p className={`font-semibold mt-0.5 ${field.highlight || ''}`}>
                            {field.value}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-slate-800">Items</h4>
                    <div className="space-y-2">
                      {detailsPurchase.items?.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex justify-between rounded-xl bg-indigo-50/60 px-3 py-2 text-sm"
                        >
                          <span>
                            {item.productName} x {item.quantity}
                          </span>
                          <span className="font-semibold text-indigo-800">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-slate-800">Payment History</h4>
                    {detailsPurchase.paymentHistory?.length > 0 ? (
                      <div className="space-y-2">
                        {[...detailsPurchase.paymentHistory]
                          .sort(
                            (a: any, b: any) =>
                              new Date(b.date).getTime() - new Date(a.date).getTime()
                          )
                          .map((payment: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-xl bg-violet-50/80 ring-1 ring-violet-100 p-3 text-sm"
                            >
                              <div>
                                <p className="font-semibold text-violet-900">
                                  {formatCurrency(payment.amount)} ({payment.paymentMode || 'Cash'})
                                </p>
                                <p className="text-slate-500">
                                  {payment.note || payment.source || 'Payment'}
                                </p>
                              </div>
                              <span className="text-slate-500 shrink-0">
                                {payment.date ? formatSaleDate(payment.date) : '-'}
                              </span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No payment history available</p>
                    )}
                  </div>
                  {canEdit && detailsPurchase.status !== 'cancelled' && (
                    <Link href={`/purchases/${detailsPurchase._id}/edit`}>
                      <Button className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0">
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Purchase
                      </Button>
                    </Link>
                  )}
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => {
            if (!open && !deleting) setDeleteTarget(null);
          }}
        >
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this purchase?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove <strong>{deleteTarget?.num}</strong> from your records.
                {(purchases.find((p) => p._id === deleteTarget?.id)?.status as string) !==
                  'cancelled' && (
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
                onClick={(e) => {
                  e.preventDefault();
                  confirmDelete();
                }}
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
