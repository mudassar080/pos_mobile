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
import {
  Search,
  Edit,
  Trash2,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  Boxes,
  Tag,
  DollarSign,
} from 'lucide-react';
import { formatCurrency } from '@/utils/constant';
import { productsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { ListPagination } from '@/components/ui/list-pagination';
import {
  ColorCard,
  NewProductButton,
  PRODUCT_GRADIENT,
  SalesPageHero,
  STAT_GRID_CLASS,
  SummaryStat,
} from '@/components/products/products-ui';
import { ProductFormDialog } from '@/components/products/product-form-dialog';

function ProfitIndicator({ profit }: { profit: number | null }) {
  if (profit === null) return null;
  if (profit > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        <TrendingUp className="h-3 w-3" />
      </span>
    );
  }
  if (profit < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
        <TrendingDown className="h-3 w-3" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600">
      <Minus className="h-3 w-3" />
    </span>
  );
}

export default function ProductsPage() {
  const { toast } = useToast();
  const { canEdit, canDelete } = usePermissions();
  const [categories, setCategories] = useState<string[]>([]);
  const [stockSummary, setStockSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    model: '',
    color: '',
  });

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
    refetch,
  } = usePaginatedList((params) => productsApi.getAll(params), { sortOrder: 'desc' });

  const fetchStockSummary = async () => {
    try {
      const response = await productsApi.getStockSummary();
      if (response.success && response.data) {
        setStockSummary(response.data);
      }
    } catch {
      // Summary cards fall back to dashes
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productsApi.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  useEffect(() => {
    setSummaryLoading(true);
    Promise.all([fetchStockSummary(), fetchCategories()]).finally(() => {
      setSummaryLoading(false);
    });
  }, []);

  const handleOpenAddDialog = () => {
    setEditingProduct(null);
    setFormData({ name: '', category: '', brand: '', model: '', color: '' });
    setShowAddDialog(true);
  };

  const handleOpenEditDialog = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category: product.category || '',
      brand: product.brand || '',
      model: product.model || '',
      color: product.color || '',
    });
    setShowAddDialog(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Please select or enter an Item Name',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const toTitleCase = (str: string) =>
        str
          .toLowerCase()
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
          .trim();

      const name = formData.name ? toTitleCase(formData.name) : '';
      const brand = formData.brand ? toTitleCase(formData.brand) : '';
      const model = formData.model ? toTitleCase(formData.model) : '';
      const color = formData.color ? toTitleCase(formData.color) : '';
      const itemCategory = [name, brand, model].filter(Boolean).join(' - ');

      const productData = {
        name,
        category: itemCategory,
        brand,
        model,
        color: color || null,
      };

      if (editingProduct) {
        await productsApi.update(editingProduct._id, productData);
        toast({ title: 'Success', description: 'Product updated successfully' });
      } else {
        await productsApi.create(productData);
        toast({ title: 'Success', description: 'Product created successfully' });
      }

      setShowAddDialog(false);
      setEditingProduct(null);
      await refetch();
      await fetchStockSummary();
      fetchCategories();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save product',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productsApi.delete(deleteTarget.id);
      toast({ title: 'Success', description: 'Product deleted successfully' });
      setDeleteTarget(null);
      await refetch();
      await fetchStockSummary();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const itemNameOptions = Array.from(
    new Set(products.map((p) => p.name).filter(Boolean))
  ).map((name) => ({ value: name, label: name }));

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title="Products"
          description="Manage your product catalog and inventory items"
          badge="Catalog"
          gradient={PRODUCT_GRADIENT}
          actions={<NewProductButton onClick={handleOpenAddDialog} />}
        />

        <div className={STAT_GRID_CLASS}>
          <SummaryStat
            label="Total Products"
            value={loading ? '-' : String(pagination.total || 0)}
            icon={Package}
            theme="bg-gradient-to-br from-sky-50 to-cyan-100 text-sky-900 ring-1 ring-sky-100"
          />
          <SummaryStat
            label="Total Stock"
            value={summaryLoading ? '-' : String(stockSummary?.totalItems ?? 0)}
            icon={Boxes}
            theme="bg-gradient-to-br from-cyan-50 to-teal-100 text-cyan-900 ring-1 ring-cyan-100"
          />
          <SummaryStat
            label="In Stock"
            value={summaryLoading ? '-' : String(stockSummary?.phones?.available ?? 0)}
            icon={TrendingUp}
            theme="bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-900 ring-1 ring-emerald-100"
          />
          <SummaryStat
            label="With Sale Price"
            value={summaryLoading ? '-' : '-'}
            icon={DollarSign}
            theme="bg-gradient-to-br from-teal-50 to-cyan-100 text-teal-900 ring-1 ring-teal-100"
          />
        </div>

        {!loading && categories.length > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm text-cyan-800 ring-1 ring-cyan-100">
            <Tag className="h-4 w-4" />
            <strong>{categories.length}</strong> categories in catalog
          </div>
        )}

        <ColorCard
          title={`Product List${pagination.total ? ` (${pagination.total})` : ''}`}
          headerClassName="bg-gradient-to-r from-sky-50 via-cyan-50 to-teal-50 border-cyan-100/50 text-cyan-900"
        >
          <div className="mb-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, brand, model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {products.map((product) => {
                  const hasSellingPrice =
                    product.sellingPrice != null && product.sellingPrice > 0;
                  const profit = hasSellingPrice
                    ? product.sellingPrice - product.purchasePrice
                    : null;

                  return (
                    <div
                      key={product._id}
                      className="rounded-2xl border border-cyan-100/80 bg-gradient-to-br from-white to-cyan-50/30 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-cyan-900">{product.name}</p>
                            <ProfitIndicator profit={profit} />
                          </div>
                          <p className="text-sm text-slate-600 mt-0.5">
                            {[product.brand, product.model].filter(Boolean).join(' · ') || '—'}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {product.category || 'No code'}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-xl bg-cyan-50 px-2.5 py-1 text-sm font-bold text-cyan-800">
                          Qty {product.quantity ?? 0}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-xs text-slate-500">Purchase</p>
                          <p className="font-semibold">{formatCurrency(product.purchasePrice)}</p>
                        </div>
                        <div className="rounded-xl bg-teal-50 px-3 py-2">
                          <p className="text-xs text-teal-600">Selling</p>
                          <p className="font-semibold text-teal-800">
                            {product.sellingPrice ? formatCurrency(product.sellingPrice) : '—'}
                          </p>
                        </div>
                      </div>
                      {(product.imei || product.color) && (
                        <p className="mt-2 text-xs text-slate-500 font-mono">
                          {product.imei && `IMEI: ${product.imei}`}
                          {product.imei && product.color && ' · '}
                          {product.color && `Color: ${product.color}`}
                        </p>
                      )}
                      {(canEdit || canDelete) && (
                        <div className="mt-3 flex items-center justify-end gap-1">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl text-cyan-700 hover:bg-cyan-50"
                              onClick={() => handleOpenEditDialog(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl text-red-600 hover:bg-red-50"
                              onClick={() =>
                                setDeleteTarget({ id: product._id, name: product.name })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {products.length === 0 && (
                  <p className="text-center py-8 text-slate-500">No products found</p>
                )}
              </div>

              <div className="hidden md:block overflow-x-auto rounded-xl ring-1 ring-cyan-100/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-sky-50 to-cyan-50/80">
                      <TableHead>Item Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>IMEI</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Purchase Price</TableHead>
                      <TableHead>Selling Price</TableHead>
                      {(canEdit || canDelete) && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const hasSellingPrice =
                        product.sellingPrice != null && product.sellingPrice > 0;
                      const profit = hasSellingPrice
                        ? product.sellingPrice - product.purchasePrice
                        : null;

                      return (
                        <TableRow key={product._id} className="hover:bg-cyan-50/20">
                          <TableCell className="text-slate-600 text-sm">
                            {product.category || '—'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-cyan-900">{product.name}</span>
                              <ProfitIndicator profit={profit} />
                            </div>
                          </TableCell>
                          <TableCell>{product.brand || '—'}</TableCell>
                          <TableCell>{product.model || '—'}</TableCell>
                          <TableCell className="font-mono text-sm text-indigo-600">
                            {product.imei || '—'}
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                (product.quantity ?? 0) > 0
                                  ? 'font-semibold text-emerald-700'
                                  : 'text-slate-500'
                              }
                            >
                              {product.quantity ?? 0}
                            </span>
                          </TableCell>
                          <TableCell>{product.color || '—'}</TableCell>
                          <TableCell>{formatCurrency(product.purchasePrice)}</TableCell>
                          <TableCell className="font-medium text-teal-700">
                            {product.sellingPrice ? formatCurrency(product.sellingPrice) : '—'}
                          </TableCell>
                          {(canEdit || canDelete) && (
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-xl text-cyan-700 hover:bg-cyan-50"
                                    onClick={() => handleOpenEditDialog(product)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-xl text-red-600 hover:bg-red-50"
                                    onClick={() =>
                                      setDeleteTarget({ id: product._id, name: product.name })
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                    {products.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={canEdit || canDelete ? 10 : 9} className="text-center py-8 text-slate-500">
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

        <ProductFormDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          editing={!!editingProduct}
          form={formData}
          onFormChange={setFormData}
          itemNameOptions={itemNameOptions}
          onSave={handleSaveProduct}
          saving={saving}
        />

        <AlertDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => {
            if (!open && !deleting) setDeleteTarget(null);
          }}
        >
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this product?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove <strong>{deleteTarget?.name}</strong> from your
                catalog. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
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
