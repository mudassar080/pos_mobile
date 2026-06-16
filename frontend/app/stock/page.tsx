'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
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
import {
  Search,
  AlertTriangle,
  Smartphone,
  Package,
  Loader2,
  DollarSign,
  Warehouse,
} from 'lucide-react';
import { productsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { ListPagination } from '@/components/ui/list-pagination';
import { formatCurrency } from '@/utils/constant';
import {
  ColorCard,
  SalesPageHero,
  STOCK_GRADIENT,
  SummaryStat,
} from '@/components/stock/stock-ui';

function getStatusBadge(product: any) {
  if (product.imei) {
    switch (product.status) {
      case 'available':
        return (
          <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 border-0">
            Available
          </Badge>
        );
      case 'sold':
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 border-0">Sold</Badge>
        );
      case 'returned':
        return (
          <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 border-0">
            Returned
          </Badge>
        );
      case 'damaged':
        return (
          <Badge className="bg-gradient-to-r from-rose-500 to-red-600 border-0">Damaged</Badge>
        );
      default:
        return <Badge variant="outline">{product.status}</Badge>;
    }
  }
  if ((product.quantity || 0) <= 0) {
    return (
      <Badge className="bg-gradient-to-r from-rose-500 to-red-600 border-0">Out of Stock</Badge>
    );
  }
  if ((product.quantity || 0) <= 5) {
    return (
      <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 border-0">Low Stock</Badge>
    );
  }
  return (
    <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 border-0">In Stock</Badge>
  );
}

function getDisplayQty(product: any) {
  return product.imei ? (product.status === 'available' ? 1 : 0) : product.quantity || 0;
}

export default function StockPage() {
  const { toast } = useToast();
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [stockSummary, setStockSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const {
    items: products,
    loading,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    search,
    setSearch,
  } = usePaginatedList((params) => productsApi.getAll(params), { sortOrder: 'desc' });

  const fetchSummaryData = async () => {
    try {
      setSummaryLoading(true);
      const [lowStockRes, summaryRes] = await Promise.all([
        productsApi.getLowStock(),
        productsApi.getStockSummary(),
      ]);
      if (lowStockRes.success && lowStockRes.data) {
        setLowStock(lowStockRes.data);
      }
      if (summaryRes.success && summaryRes.data) {
        setStockSummary(summaryRes.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch stock',
        variant: 'destructive',
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title="Stock Management"
          description="Track phone and accessory inventory levels"
          badge="Inventory"
          gradient={STOCK_GRADIENT}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SummaryStat
            label="Phones Available"
            value={summaryLoading ? '-' : String(stockSummary?.phones?.available || 0)}
            icon={Smartphone}
            theme="bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-900 ring-1 ring-blue-100"
          />
          <SummaryStat
            label="Accessories Stock"
            value={summaryLoading ? '-' : String(stockSummary?.accessories?.totalQuantity || 0)}
            icon={Package}
            theme="bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-900 ring-1 ring-emerald-100"
          />
          <SummaryStat
            label="Stock Value"
            value={summaryLoading ? '-' : formatCurrency(stockSummary?.totalValue || 0)}
            icon={DollarSign}
            theme="bg-gradient-to-br from-teal-50 to-cyan-100 text-teal-900 ring-1 ring-teal-100"
          />
          <SummaryStat
            label="Low Stock Items"
            value={summaryLoading ? '-' : String(lowStock.length)}
            icon={AlertTriangle}
            theme="bg-gradient-to-br from-orange-50 to-amber-100 text-orange-900 ring-1 ring-orange-100"
          />
        </div>

        {!summaryLoading && stockSummary?.totalSellingValue != null && (
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm text-teal-800 ring-1 ring-teal-100">
            <Warehouse className="h-4 w-4" />
            Sale value:{' '}
            <strong>{formatCurrency(stockSummary.totalSellingValue)}</strong>
            {stockSummary?.accessories?.totalProducts != null && (
              <span className="text-teal-600">
                · {stockSummary.accessories.totalProducts} accessory products
              </span>
            )}
          </div>
        )}

        {!summaryLoading && lowStock.length > 0 && (
          <div className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50/80 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-900">
                {lowStock.length} item{lowStock.length !== 1 ? 's' : ''} running low
              </p>
              <p className="text-sm text-orange-700 mt-0.5">
                {lowStock
                  .slice(0, 3)
                  .map((p: any) => p.name)
                  .join(', ')}
                {lowStock.length > 3 && ` and ${lowStock.length - 3} more`}
              </p>
            </div>
          </div>
        )}

        <ColorCard
          title={`Stock Inventory${pagination.total ? ` (${pagination.total})` : ''}`}
          headerClassName="bg-gradient-to-r from-teal-50 via-emerald-50 to-green-50 border-emerald-100/50 text-emerald-900"
        >
          <div className="mb-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, IMEI, brand, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {products.map((product) => {
                  const qty = getDisplayQty(product);
                  const isLow = !product.imei && (product.quantity || 0) <= 5;

                  return (
                    <div
                      key={product._id}
                      className="rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-white to-teal-50/30 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-emerald-900">{product.name}</p>
                          <p className="text-sm text-slate-600 mt-0.5">
                            {[product.brand, product.category].filter(Boolean).join(' · ') || '—'}
                          </p>
                          {product.imei && (
                            <p className="text-xs font-mono text-indigo-600 mt-1">{product.imei}</p>
                          )}
                        </div>
                        {getStatusBadge(product)}
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-xs text-slate-500">Qty</p>
                          <p
                            className={`font-bold ${isLow ? 'text-orange-600' : 'text-emerald-800'}`}
                          >
                            {qty}
                          </p>
                        </div>
                        <div className="rounded-xl bg-teal-50 px-3 py-2">
                          <p className="text-xs text-teal-600">Purchase</p>
                          <p className="font-semibold text-teal-800">
                            {formatCurrency(product.purchasePrice || 0)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 px-3 py-2">
                          <p className="text-xs text-emerald-600">Selling</p>
                          <p className="font-semibold text-emerald-800">
                            {product.sellingPrice ? formatCurrency(product.sellingPrice) : '—'}
                          </p>
                        </div>
                      </div>
                      {product.color && (
                        <p className="mt-2 text-xs text-slate-500">Color: {product.color}</p>
                      )}
                    </div>
                  );
                })}
                {products.length === 0 && (
                  <p className="text-center py-8 text-slate-500">No products found</p>
                )}
              </div>

              <div className="hidden md:block overflow-x-auto rounded-xl ring-1 ring-emerald-100/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-teal-50 to-emerald-50/80">
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>IMEI</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Purchase Price</TableHead>
                      <TableHead className="text-right">Selling Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const qty = getDisplayQty(product);
                      const isLow = !product.imei && (product.quantity || 0) <= 5;

                      return (
                        <TableRow key={product._id} className="hover:bg-emerald-50/20">
                          <TableCell className="font-medium text-emerald-900">
                            {product.name}
                          </TableCell>
                          <TableCell className="text-slate-600 text-sm">
                            {product.category || '—'}
                          </TableCell>
                          <TableCell>{product.brand || '—'}</TableCell>
                          <TableCell className="font-mono text-sm text-indigo-600">
                            {product.imei || '—'}
                          </TableCell>
                          <TableCell>{product.color || '—'}</TableCell>
                          <TableCell className="text-center">
                            <span
                              className={
                                isLow ? 'font-bold text-orange-600' : 'font-semibold text-emerald-700'
                              }
                            >
                              {qty}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(product.purchasePrice || 0)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-teal-700">
                            {product.sellingPrice ? formatCurrency(product.sellingPrice) : '—'}
                          </TableCell>
                          <TableCell>{getStatusBadge(product)}</TableCell>
                        </TableRow>
                      );
                    })}
                    {products.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                          No products found
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
      </div>
    </MainLayout>
  );
}
