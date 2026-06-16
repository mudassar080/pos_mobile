'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Trash2, ShoppingCart, DollarSign, Wallet, Receipt } from 'lucide-react';
import Link from 'next/link';
import { salesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { formatCurrency } from '@/utils/constant';
import {
  ColorCard,
  formatSaleDate,
  formatSaleDateShort,
  getStatusBadge,
  NewSaleButton,
  SaleActionLinks,
  SalesPageHero,
  SummaryStat,
} from '@/components/sales/sales-ui';

export default function SalesPage() {
  const { toast } = useToast();
  const { canEdit, canDelete } = usePermissions();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await salesApi.getAll({ limit: '100', sortOrder: 'desc' });
      if (response.success && response.data) {
        setSales(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch sales',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sale: any) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete sale ${sale.invoiceNumber}?\n\nThis will restore all linked products back to available status.`
    );
    if (!confirmed) return;

    setDeletingId(sale._id);
    try {
      const response = await salesApi.delete(sale._id);
      if (response.success) {
        toast({
          title: 'Sale Deleted',
          description: `${sale.invoiceNumber} deleted and products restored`,
        });
        await fetchSales();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete sale',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const filteredSales = sales.filter(
    (sale) =>
      sale.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeSales = filteredSales.filter((s) => s.status !== 'cancelled');
  const totalAmount = activeSales.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalPaid = activeSales.reduce((sum, s) => sum + (s.paid || 0), 0);
  const totalDue = totalAmount - totalPaid;

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title="Sales"
          description="Manage all sales transactions"
          badge="Transactions"
          gradient="from-cyan-600 via-blue-600 to-indigo-700"
          actions={<NewSaleButton />}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SummaryStat
            label="Total Sales"
            value={String(activeSales.length)}
            icon={ShoppingCart}
            theme="bg-gradient-to-br from-cyan-50 to-blue-100 text-cyan-900 ring-1 ring-cyan-100"
          />
          <SummaryStat
            label="Total Amount"
            value={formatCurrency(totalAmount)}
            icon={DollarSign}
            theme="bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-900 ring-1 ring-emerald-100"
          />
          <SummaryStat
            label="Collected"
            value={formatCurrency(totalPaid)}
            icon={Receipt}
            theme="bg-gradient-to-br from-violet-50 to-purple-100 text-violet-900 ring-1 ring-violet-100"
          />
          <SummaryStat
            label="Outstanding"
            value={formatCurrency(totalDue)}
            icon={Wallet}
            theme="bg-gradient-to-br from-orange-50 to-amber-100 text-orange-900 ring-1 ring-orange-100"
          />
        </div>

        <ColorCard
          title="Sales List"
          headerClassName="bg-gradient-to-r from-slate-50 via-blue-50/50 to-indigo-50/50 border-indigo-100/50 text-slate-800"
        >
          <div className="mb-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by invoice or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {filteredSales.map((sale) => (
                  <div
                    key={sale._id}
                    className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/sales/${sale._id}`}
                          className="font-semibold text-indigo-700 hover:underline"
                        >
                          {sale.invoiceNumber}
                        </Link>
                        <p className="text-sm text-slate-600 truncate mt-0.5">{sale.customerName}</p>
                        <p className="text-xs text-slate-400 mt-1">{formatSaleDateShort(sale.date)}</p>
                      </div>
                      <div className="shrink-0">{getStatusBadge(sale.status)}</div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-xl bg-emerald-50 px-3 py-2">
                        <p className="text-xs text-emerald-600">Amount</p>
                        <p className="font-bold text-emerald-800">{formatCurrency(sale.amount)}</p>
                      </div>
                      <div className="rounded-xl bg-violet-50 px-3 py-2">
                        <p className="text-xs text-violet-600">Paid</p>
                        <p className="font-bold text-violet-800">{formatCurrency(sale.paid)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Badge variant="outline" className="rounded-lg border-slate-200">
                        {sale.paymentMode}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <SaleActionLinks
                          saleId={sale._id}
                          status={sale.status}
                          size="icon"
                          allowEdit={canEdit}
                        />
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(sale)}
                            disabled={deletingId === sale._id}
                            className="rounded-lg text-red-600 hover:bg-red-50"
                          >
                            {deletingId === sale._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredSales.length === 0 && (
                  <div className="rounded-2xl bg-slate-50 py-10 text-center text-slate-500 text-sm">
                    No sales found
                  </div>
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto rounded-xl ring-1 ring-slate-200/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-50 to-indigo-50/50 hover:from-slate-50 hover:to-indigo-50/50">
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale._id} className="hover:bg-blue-50/30">
                        <TableCell>
                          <Link
                            href={`/sales/${sale._id}`}
                            className="font-semibold text-indigo-700 hover:underline"
                          >
                            {sale.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="text-slate-600">{formatSaleDate(sale.date)}</TableCell>
                        <TableCell>{sale.customerName}</TableCell>
                        <TableCell>{sale.itemsCount || sale.items?.length || 0}</TableCell>
                        <TableCell className="font-medium text-emerald-700">
                          {formatCurrency(sale.amount)}
                        </TableCell>
                        <TableCell className="font-medium text-violet-700">
                          {formatCurrency(sale.paid)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg">
                            {sale.paymentMode}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(sale.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <SaleActionLinks
                              saleId={sale._id}
                              status={sale.status}
                              allowEdit={canEdit}
                            />
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(sale)}
                                disabled={deletingId === sale._id}
                                className="text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                {deletingId === sale._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredSales.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-slate-500">
                          No sales found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </ColorCard>
      </div>
    </MainLayout>
  );
}
