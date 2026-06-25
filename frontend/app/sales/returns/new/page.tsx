'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Loader2, RotateCcw, Package, DollarSign, TrendingUp } from 'lucide-react';
import { saleReturnsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, REFUND_METHODS } from '@/utils/constant';
import { normalizeSaleLineItem } from '@/lib/line-items';
import {
  ProductNameCell,
  LineItemBrandCell,
  LineItemModelCell,
  LineItemCategoryCell,
  LineItemImeiCell,
} from '@/components/line-items/line-item-table-cells';
import { cn } from '@/lib/utils';
import { ColorCard, SalesPageHero, STAT_GRID_CLASS, SummaryStat } from '@/components/sales/sales-ui';

const reasons = ['Defective', 'Wrong Item', 'Not Satisfied', 'Damaged', 'Other'];
const conditions = ['resellable', 'damaged'];

type SaleReturnLineItem = ReturnType<typeof normalizeSaleLineItem> & {
  quantity: number;
  maxQuantity: number;
  originalSaleQty: number;
  alreadyReturned: number;
  price: number;
  returnPrice: number;
  condition: string;
  selected: boolean;
};

export default function NewSalesReturnPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [sales, setSales] = useState<any[]>([]);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [formData, setFormData] = useState({
    sale: '',
    reason: 'Defective',
    refundMethod: 'Cash',
    notes: '',
  });
  const [returnItems, setReturnItems] = useState<SaleReturnLineItem[]>([]);

  const fetchSales = async () => {
    try {
      setLoadingSales(true);
      const response = await saleReturnsApi.getReturnableSales();
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
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleSaleChange = async (saleId: string) => {
    const sale = sales.find((s) => s._id === saleId);
    setSelectedSale(sale);
    setFormData((prev) => ({ ...prev, sale: saleId }));

    if (!sale?.items) {
      setReturnItems([]);
      return;
    }

    setLoadingItems(true);
    try {
      const returnedRes = await saleReturnsApi.getReturnedQuantities(saleId);
      const returnedMap = returnedRes.success ? returnedRes.data : {};

      const items: SaleReturnLineItem[] = sale.items.map((item: any) => {
        const key = item.imei || (item.product?._id || item.product);
        const alreadyReturned = returnedMap[key] || 0;
        const remainingQty = Math.max(0, item.quantity - alreadyReturned);
        return {
          ...normalizeSaleLineItem(item),
          quantity: 0,
          maxQuantity: remainingQty,
          originalSaleQty: item.quantity,
          alreadyReturned,
          price: item.price,
          returnPrice: item.price,
          condition: 'resellable',
          selected: false,
        };
      });

      const hasReturnableItems = items.some((item) => item.maxQuantity > 0);
      if (!hasReturnableItems) {
        setSales((prev) => prev.filter((s) => s._id !== saleId));
        setSelectedSale(null);
        setReturnItems([]);
        setFormData((prev) => ({ ...prev, sale: '' }));
        toast({
          title: 'Invoice unavailable',
          description: 'All items from this sale have already been returned.',
        });
        return;
      }

      setReturnItems(items);
    } catch {
      setReturnItems(
        sale.items.map((item: any) => ({
          ...normalizeSaleLineItem(item),
          quantity: 0,
          maxQuantity: item.quantity,
          originalSaleQty: item.quantity,
          alreadyReturned: 0,
          price: item.price,
          returnPrice: item.price,
          condition: 'resellable',
          selected: false,
        }))
      );
    } finally {
      setLoadingItems(false);
    }
  };

  const handleItemToggle = (index: number, checked: boolean) => {
    const updated = [...returnItems];
    if (updated[index].maxQuantity <= 0) return;
    updated[index].selected = checked;
    if (checked && updated[index].quantity === 0) {
      updated[index].quantity = updated[index].maxQuantity;
    }
    if (!checked) {
      updated[index].quantity = 0;
    }
    setReturnItems(updated);
  };

  const handleItemQuantityChange = (index: number, quantity: number) => {
    const updated = [...returnItems];
    updated[index].quantity = Math.min(Math.max(0, quantity), updated[index].maxQuantity);
    updated[index].selected = updated[index].quantity > 0;
    setReturnItems(updated);
  };

  const handleItemConditionChange = (index: number, condition: string) => {
    const updated = [...returnItems];
    updated[index].condition = condition;
    setReturnItems(updated);
  };

  const handleItemReturnPriceChange = (index: number, value: string) => {
    const updated = [...returnItems];
    const num = parseFloat(value);
    updated[index].returnPrice =
      Number.isNaN(num) || num < 0 ? 0 : Math.min(num, updated[index].price);
    setReturnItems(updated);
  };

  const handleCreateReturn = async () => {
    const itemsToReturn = returnItems.filter((item) => item.selected && item.quantity > 0);

    if (!formData.sale) {
      toast({
        title: 'Validation Error',
        description: 'Please select a sale/invoice',
        variant: 'destructive',
      });
      return;
    }

    if (itemsToReturn.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one item to return',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const returnData = {
        sale: formData.sale,
        items: itemsToReturn.map((item) => ({
          product: item.product,
          imei: item.imei,
          quantity: item.quantity,
          price: item.price,
          returnPrice: item.returnPrice ?? item.price,
          condition: item.condition,
        })),
        reason: formData.reason,
        refundMethod: formData.refundMethod,
        notes: formData.notes,
      };

      await saleReturnsApi.create(returnData);
      toast({
        title: 'Success',
        description: 'Sale return created successfully',
      });
      router.push('/sales/returns');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create sale return',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedItems = returnItems.filter((item) => item.selected && item.quantity > 0);
  const totalRefund = selectedItems.reduce(
    (sum, item) => sum + (item.returnPrice ?? item.price) * item.quantity,
    0
  );
  const totalCostImpact = selectedItems.reduce(
    (sum, item) =>
      sum + ((item.purchasePrice ?? 0) - (item.returnPrice ?? item.price)) * item.quantity,
    0
  );

  const refundHint =
    formData.refundMethod === 'Credit'
      ? 'Amount will be adjusted against customer balance.'
      : formData.refundMethod === 'Cash'
        ? 'Amount will be refunded in cash to customer.'
        : 'No cash/credit impact — items will be replaced.';

  if (loadingSales) {
    return (
      <MainLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-36 rounded-3xl bg-gradient-to-r from-orange-200 via-amber-200 to-yellow-200" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 rounded-2xl bg-slate-100" />
            <div className="h-80 rounded-2xl bg-slate-100" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title="Process Sales Return"
          description="Create a new return from an existing sale"
          badge="New Return"
          gradient="from-orange-600 via-amber-600 to-yellow-600"
          backHref="/sales/returns"
        />

        <div className={STAT_GRID_CLASS}>
          <SummaryStat
            label="Selected Items"
            value={String(selectedItems.length)}
            icon={Package}
            theme="bg-gradient-to-br from-orange-50 to-amber-100 text-orange-900 ring-1 ring-orange-100"
          />
          <SummaryStat
            label="Total Refund"
            value={formatCurrency(totalRefund)}
            icon={DollarSign}
            theme="bg-gradient-to-br from-rose-50 to-orange-100 text-rose-900 ring-1 ring-rose-100"
          />
          <SummaryStat
            label="Cost Impact"
            value={`${totalCostImpact >= 0 ? '+' : '-'}${formatCurrency(Math.abs(totalCostImpact))}`}
            icon={TrendingUp}
            theme={
              totalCostImpact >= 0
                ? 'bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-900 ring-1 ring-emerald-100'
                : 'bg-gradient-to-br from-red-50 to-rose-100 text-red-900 ring-1 ring-red-100'
            }
          />
          <SummaryStat
            label="Invoice"
            value={selectedSale?.invoiceNumber || '—'}
            icon={RotateCcw}
            theme="bg-gradient-to-br from-amber-50 to-yellow-100 text-amber-900 ring-1 ring-amber-100"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <ColorCard
              title="Select Invoice & Items"
              headerClassName="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100/50 text-orange-900"
            >
              <div className="space-y-4">
                <div>
                  <Label>Select Invoice *</Label>
                  <Select value={formData.sale} onValueChange={handleSaleChange}>
                    <SelectTrigger className="rounded-xl mt-1.5">
                      <SelectValue placeholder="Choose invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      {sales.map((sale) => (
                        <SelectItem key={sale._id} value={sale._id}>
                          {sale.invoiceNumber} - {sale.customerName} ({formatCurrency(sale.amount)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSale && loadingItems && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                  </div>
                )}

                {selectedSale && !loadingItems && returnItems.length > 0 && (
                  <>
                    {/* Mobile item cards */}
                    <div className="space-y-3 md:hidden">
                      {returnItems.map((item, index) => {
                        const fullyReturned = item.maxQuantity <= 0;
                        return (
                        <div
                          key={index}
                          className={cn(
                            'rounded-2xl border p-4 transition-colors',
                            item.selected
                              ? 'border-orange-200 bg-gradient-to-br from-orange-50/80 to-amber-50/50'
                              : 'border-slate-200 bg-white',
                            fullyReturned && 'opacity-50'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={item.selected}
                              onCheckedChange={(checked) =>
                                handleItemToggle(index, checked as boolean)
                              }
                              className="mt-1"
                              disabled={fullyReturned}
                            />
                            <div className="flex-1 min-w-0">
                              <ProductNameCell item={item} showViewButton={false} />
                              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600">
                                <span>Brand: <LineItemBrandCell item={item} /></span>
                                <span>Model: <LineItemModelCell item={item} /></span>
                                <span>Category: <LineItemCategoryCell item={item} /></span>
                                <span>IMEI: <LineItemImeiCell item={item} /></span>
                              </div>
                              {item.alreadyReturned > 0 && (
                                <p className="text-xs text-orange-600 mt-1">
                                  {item.alreadyReturned} of {item.originalSaleQty} already returned
                                </p>
                              )}
                              {!item.imei && (
                                <p className="text-xs text-slate-500 mt-1">Max qty: {item.maxQuantity}</p>
                              )}
                              <p className="text-sm text-slate-500 mt-1">
                                Sale: {formatCurrency(item.price)}
                              </p>
                            </div>
                          </div>
                          {item.selected && (
                            <div className="mt-3 grid grid-cols-2 gap-2 pl-7">
                              {!item.imei && (
                                <div>
                                  <Label className="text-xs">Qty</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={item.maxQuantity}
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleItemQuantityChange(index, parseInt(e.target.value) || 0)
                                    }
                                    className="rounded-lg mt-1 h-9"
                                    disabled={fullyReturned}
                                  />
                                </div>
                              )}
                              <div>
                                <Label className="text-xs">Return Price</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max={item.price}
                                  value={item.returnPrice ?? item.price}
                                  onChange={(e) => handleItemReturnPriceChange(index, e.target.value)}
                                  className="rounded-lg mt-1 h-9"
                                  disabled={fullyReturned}
                                />
                              </div>
                              <div className="col-span-2">
                                <Label className="text-xs">Condition</Label>
                                <Select
                                  value={item.condition}
                                  onValueChange={(value) => handleItemConditionChange(index, value)}
                                >
                                  <SelectTrigger className="rounded-lg mt-1 h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {conditions.map((cond) => (
                                      <SelectItem key={cond} value={cond}>
                                        {cond.charAt(0).toUpperCase() + cond.slice(1)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto rounded-xl ring-1 ring-orange-100/70">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-orange-50 to-amber-50/80">
                            <TableHead className="w-10">Sel</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>IMEI</TableHead>
                            <TableHead>Sale Price</TableHead>
                            <TableHead>Return Price</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Condition</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {returnItems.map((item, index) => {
                            const fullyReturned = item.maxQuantity <= 0;
                            return (
                            <TableRow
                              key={index}
                              className={cn(
                                item.selected && 'bg-orange-50/40',
                                fullyReturned && 'opacity-50'
                              )}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={item.selected}
                                  onCheckedChange={(checked) =>
                                    handleItemToggle(index, checked as boolean)
                                  }
                                  disabled={fullyReturned}
                                />
                              </TableCell>
                              <TableCell>
                                <ProductNameCell item={item} showViewButton={false} />
                                {item.alreadyReturned > 0 && (
                                  <p className="text-xs text-orange-600 mt-1">
                                    {item.alreadyReturned} of {item.originalSaleQty} already returned
                                  </p>
                                )}
                              </TableCell>
                              <TableCell><LineItemBrandCell item={item} /></TableCell>
                              <TableCell><LineItemModelCell item={item} /></TableCell>
                              <TableCell><LineItemCategoryCell item={item} /></TableCell>
                              <TableCell><LineItemImeiCell item={item} /></TableCell>
                              <TableCell>{formatCurrency(item.price)}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  max={item.price}
                                  value={item.returnPrice ?? item.price}
                                  onChange={(e) => handleItemReturnPriceChange(index, e.target.value)}
                                  className="w-24 rounded-lg"
                                  disabled={!item.selected || fullyReturned}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  max={item.maxQuantity}
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleItemQuantityChange(index, parseInt(e.target.value) || 0)
                                  }
                                  className="w-20 rounded-lg"
                                  disabled={!item.selected || !!item.imei || fullyReturned}
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={item.condition}
                                  onValueChange={(value) => handleItemConditionChange(index, value)}
                                  disabled={!item.selected || fullyReturned}
                                >
                                  <SelectTrigger className="w-32 rounded-lg">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {conditions.map((cond) => (
                                      <SelectItem key={cond} value={cond}>
                                        {cond.charAt(0).toUpperCase() + cond.slice(1)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-orange-700">
                                {formatCurrency(
                                  item.selected && item.quantity > 0
                                    ? (item.returnPrice ?? item.price) * item.quantity
                                    : 0
                                )}
                              </TableCell>
                            </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}

                {!selectedSale && (
                  <div className="rounded-2xl bg-slate-50 py-10 text-center text-sm text-slate-500">
                    Select an invoice to choose items for return
                  </div>
                )}
              </div>
            </ColorCard>
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start space-y-4 sm:space-y-6">
            <ColorCard
              title="Return Summary"
              headerClassName="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-100/50 text-amber-900"
            >
              <div className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-slate-600">Customer</span>
                    <span className="font-semibold truncate ml-2">
                      {selectedSale?.customerName || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between rounded-xl bg-orange-50 px-3 py-2">
                    <span className="text-orange-700">Selected Items</span>
                    <span className="font-bold text-orange-900">{selectedItems.length}</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-4 text-white shadow-lg shadow-orange-200/50">
                  <p className="text-orange-100 text-sm">Total Refund</p>
                  <p className="text-2xl font-bold mt-0.5">{formatCurrency(totalRefund)}</p>
                </div>

                <div>
                  <Label>Reason *</Label>
                  <Select
                    value={formData.reason}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, reason: value }))}
                  >
                    <SelectTrigger className="rounded-xl mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reasons.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Refund Method</Label>
                  <Select
                    value={formData.refundMethod}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, refundMethod: value }))
                    }
                  >
                    <SelectTrigger className="rounded-xl mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REFUND_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any notes..."
                    rows={3}
                    className="rounded-xl mt-1.5 resize-none"
                  />
                </div>

                <div className="flex items-start gap-2 text-xs text-amber-800 rounded-xl bg-amber-50 border border-amber-100 p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{refundHint}</span>
                </div>

                <Button
                  onClick={handleCreateReturn}
                  className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 border-0 shadow-lg shadow-orange-300/40"
                  size="lg"
                  disabled={saving || loadingItems || !formData.sale || selectedItems.length === 0}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Process Return
                </Button>
              </div>
            </ColorCard>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
