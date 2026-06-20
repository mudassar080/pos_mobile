'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle, Package, DollarSign, RotateCcw, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { purchaseReturnsApi, purchasesApi } from '@/lib/api';
import { paginatedParams } from '@/lib/pagination';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, REFUND_METHODS } from '@/utils/constant';
import { Combobox } from '@/components/ui/combobox';
import {
  ColorCard,
  PURCHASE_RETURN_GRADIENT,
  SalesPageHero,
  STAT_GRID_CLASS,
  SummaryStat,
  purchaseBtnPrimary,
  purchaseBtnSecondary,
} from '@/components/purchases/purchases-ui';

const reasons = ['Defective', 'Wrong Item', 'Damaged', 'Expired', 'Other'];

export default function NewPurchaseReturnPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    purchase: '',
    reason: 'Defective',
    refundMethod: 'Credit',
    notes: '',
  });
  const [returnItems, setReturnItems] = useState<any[]>([]);

  const fetchPurchases = async () => {
    try {
      setLoadingPurchases(true);
      const response = await purchasesApi.getAll(paginatedParams(300));
      if (response.success && response.data) {
        setPurchases(response.data.filter((p: any) => p.status !== 'cancelled'));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch purchases',
        variant: 'destructive',
      });
    } finally {
      setLoadingPurchases(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handlePurchaseChange = async (purchaseId: string) => {
    const purchase = purchases.find((p) => p._id === purchaseId);
    setSelectedPurchase(purchase);
    setFormData((prev) => ({ ...prev, purchase: purchaseId }));

    if (!purchase?.items) {
      setReturnItems([]);
      return;
    }

    setLoadingItems(true);
    try {
      const returnedRes = await purchaseReturnsApi.getReturnedQuantities(purchaseId);
      const returnedMap = returnedRes.success ? returnedRes.data : {};

      setReturnItems(
        purchase.items.map((item: any) => {
          const key = item.imei || (item.product?._id || item.product);
          const alreadyReturned = returnedMap[key] || 0;
          const remainingQty = Math.max(0, item.quantity - alreadyReturned);
          const prod = item.product;
          return {
            product: prod?._id || item.product,
            productName: item.productName,
            imei: item.imei,
            quantity: 0,
            maxQuantity: remainingQty,
            originalPurchaseQty: item.quantity,
            alreadyReturned,
            price: item.price,
            returnPrice: item.price,
            brand: prod?.brand || '',
            model: prod?.model || '',
            lastPurchasePrice: prod?.lastPurchasePrice ?? prod?.purchasePrice ?? 0,
          };
        })
      );
    } catch (error) {
      setReturnItems(
        purchase.items.map((item: any) => {
          const p = item.product;
          return {
            product: p?._id || item.product,
            productName: item.productName,
            imei: item.imei,
            quantity: 0,
            maxQuantity: item.quantity,
            originalPurchaseQty: item.quantity,
            alreadyReturned: 0,
            price: item.price,
            returnPrice: item.price,
            brand: p?.brand || '',
            model: p?.model || '',
            lastPurchasePrice: p?.lastPurchasePrice ?? p?.purchasePrice ?? 0,
          };
        })
      );
    } finally {
      setLoadingItems(false);
    }
  };

  const handleItemQuantityChange = (index: number, quantity: number) => {
    const updated = [...returnItems];
    updated[index].quantity = Math.min(Math.max(0, quantity), updated[index].maxQuantity);
    setReturnItems(updated);
  };

  const handleItemReturnPriceChange = (index: number, returnPrice: number) => {
    const updated = [...returnItems];
    updated[index].returnPrice = Math.max(0, returnPrice);
    setReturnItems(updated);
  };

  const selectedItems = returnItems.filter((item) => item.quantity > 0);
  const totalReturnAmount = selectedItems.reduce(
    (sum, item) => sum + item.returnPrice * item.quantity,
    0
  );

  const handleCreateReturn = async () => {
    const itemsToReturn = returnItems.filter((item) => item.quantity > 0);

    if (!formData.purchase) {
      toast({
        title: 'Validation Error',
        description: 'Please select a purchase',
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
        purchase: formData.purchase,
        items: itemsToReturn.map((item) => ({
          product: item.product,
          imei: item.imei,
          quantity: item.quantity,
          price: item.price,
          returnPrice: item.returnPrice,
        })),
        reason: formData.reason,
        refundMethod: formData.refundMethod,
        notes: formData.notes,
      };

      const res = await purchaseReturnsApi.create(returnData);
      toast({
        title: 'Success',
        description: res.message || 'Purchase return created successfully',
      });
      router.push('/purchases/returns');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create purchase return',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const refundHint =
    formData.refundMethod === 'Credit'
      ? 'Return amount will be credited against supplier payable.'
      : formData.refundMethod === 'Cash'
        ? 'Supplier will refund the amount in cash and payable will be reduced.'
        : 'Items will be replaced by supplier. No financial adjustment to payable.';

  if (loadingPurchases) {
    return (
      <MainLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-36 rounded-3xl bg-gradient-to-r from-violet-200 via-purple-200 to-fuchsia-200" />
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
          title="Create Purchase Return"
          description="Return items to suppliers and adjust payables"
          badge="New Return"
          gradient={PURCHASE_RETURN_GRADIENT}
          backHref="/purchases/returns"
        />

        <div className={STAT_GRID_CLASS}>
          <SummaryStat
            label="Selected Items"
            value={String(selectedItems.length)}
            icon={Package}
            theme="bg-gradient-to-br from-violet-50 to-purple-100 text-violet-900 ring-1 ring-violet-100"
          />
          <SummaryStat
            label="Return Amount"
            value={formatCurrency(totalReturnAmount)}
            icon={DollarSign}
            theme="bg-gradient-to-br from-fuchsia-50 to-pink-100 text-fuchsia-900 ring-1 ring-fuchsia-100"
          />
          <SummaryStat
            label="Outstanding"
            value={formatCurrency(selectedPurchase?.balance || 0)}
            icon={ShoppingBag}
            theme="bg-gradient-to-br from-rose-50 to-red-100 text-rose-900 ring-1 ring-rose-100"
          />
          <SummaryStat
            label="Purchase"
            value={selectedPurchase?.purchaseNumber || '—'}
            icon={RotateCcw}
            theme="bg-gradient-to-br from-purple-50 to-violet-100 text-purple-900 ring-1 ring-purple-100"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <ColorCard
              title="Select Purchase & Items"
              headerClassName="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-100/50 text-violet-900"
            >
              <div className="space-y-4">
                <div>
                  <Label>Select Purchase *</Label>
                  <Combobox
                    options={purchases.map((p) => ({
                      value: p._id,
                      label: `${p.purchaseNumber || ''} | ${p.supplierName || ''} | ${formatCurrency(
                        p.amount || 0
                      )}`,
                      displayLabel: p.purchaseNumber || '',
                    }))}
                    value={formData.purchase}
                    onValueChange={handlePurchaseChange}
                    placeholder="Search purchase..."
                    searchPlaceholder="Search by number, supplier, amount..."
                    emptyText="No purchases found"
                  />
                </div>

                {selectedPurchase && (
                  <div className="rounded-2xl bg-gradient-to-br from-violet-50/80 to-purple-50/50 ring-1 ring-violet-100 p-4 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-violet-600">Supplier</span>
                      <span className="font-semibold text-violet-900">
                        {selectedPurchase.supplierName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-violet-600">Purchase Amount</span>
                      <span className="font-semibold">{formatCurrency(selectedPurchase.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-violet-600">Balance (Payable)</span>
                      <span className="font-semibold text-rose-700">
                        {formatCurrency(selectedPurchase.balance)}
                      </span>
                    </div>
                  </div>
                )}

                {selectedPurchase && loadingItems && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                  </div>
                )}

                {selectedPurchase && !loadingItems && returnItems.length > 0 && (
                  <>
                    <div className="space-y-3 md:hidden">
                      {returnItems.map((item, index) => {
                        const itemTotal =
                          item.quantity > 0 ? item.returnPrice * item.quantity : 0;
                        const fullyReturned = item.maxQuantity <= 0;
                        return (
                          <div
                            key={index}
                            className={cn(
                              'rounded-2xl border p-4',
                              item.quantity > 0
                                ? 'border-violet-200 bg-gradient-to-br from-violet-50/80 to-purple-50/50'
                                : 'border-slate-200 bg-white',
                              fullyReturned && 'opacity-50'
                            )}
                          >
                            <p className="font-semibold text-slate-900">{item.productName}</p>
                            {item.alreadyReturned > 0 && (
                              <p className="text-xs text-orange-600 mt-0.5">
                                {item.alreadyReturned} of {item.originalPurchaseQty} already
                                returned
                              </p>
                            )}
                            <p className="text-xs font-mono text-violet-600 mt-1">
                              {item.imei || `Max qty: ${item.maxQuantity}`}
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Return Price</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.returnPrice}
                                  onChange={(e) =>
                                    handleItemReturnPriceChange(
                                      index,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="rounded-lg mt-1 h-9"
                                  disabled={fullyReturned}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Return Qty</Label>
                                <div className="flex items-center gap-1 mt-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    max={item.maxQuantity}
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleItemQuantityChange(index, parseInt(e.target.value) || 0)
                                    }
                                    className="rounded-lg h-9"
                                    disabled={fullyReturned}
                                  />
                                  <span className="text-xs text-slate-400">/{item.maxQuantity}</span>
                                </div>
                              </div>
                              {item.quantity > 0 && (
                                <div className="col-span-2 rounded-xl bg-violet-50 px-3 py-2">
                                  <p className="text-xs text-violet-600">Subtotal</p>
                                  <p className="font-bold text-violet-800">
                                    {formatCurrency(itemTotal)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="hidden md:block overflow-x-auto rounded-xl ring-1 ring-violet-100/70">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-violet-50 to-purple-50/80">
                            <TableHead>Product</TableHead>
                            <TableHead>IMEI</TableHead>
                            <TableHead>Purchase Price</TableHead>
                            <TableHead>Return Price</TableHead>
                            <TableHead>Return Qty</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {returnItems.map((item, index) => {
                            const itemTotal =
                              item.quantity > 0 ? item.returnPrice * item.quantity : 0;
                            const fullyReturned = item.maxQuantity <= 0;
                            return (
                              <TableRow
                                key={index}
                                className={cn(
                                  item.quantity > 0 && 'bg-violet-50/40',
                                  fullyReturned && 'opacity-50'
                                )}
                              >
                                <TableCell>
                                  <span className="font-medium">{item.productName}</span>
                                  {item.alreadyReturned > 0 && (
                                    <span className="block text-xs text-orange-600">
                                      {item.alreadyReturned} of {item.originalPurchaseQty} already
                                      returned
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {item.imei || '-'}
                                </TableCell>
                                <TableCell>{formatCurrency(item.price)}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={item.returnPrice}
                                    onChange={(e) =>
                                      handleItemReturnPriceChange(
                                        index,
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-24 rounded-lg"
                                    disabled={fullyReturned}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      max={item.maxQuantity}
                                      value={item.quantity}
                                      onChange={(e) =>
                                        handleItemQuantityChange(
                                          index,
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                      className="w-20 rounded-lg"
                                      disabled={fullyReturned}
                                    />
                                    <span className="text-xs text-slate-400">
                                      /{item.maxQuantity}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-medium text-violet-700">
                                  {formatCurrency(itemTotal)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </div>
            </ColorCard>
          </div>

          <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-20 lg:self-start">
            <ColorCard
              title="Return Summary"
              headerClassName="bg-gradient-to-r from-purple-50 to-fuchsia-50 border-purple-100/50 text-purple-900"
            >
              <div className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-slate-600">Purchase</span>
                    <span className="font-semibold">
                      {selectedPurchase?.purchaseNumber || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-slate-600">Supplier</span>
                    <span className="font-semibold truncate ml-2">
                      {selectedPurchase?.supplierName || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-slate-600">Selected Items</span>
                    <span className="font-semibold">{selectedItems.length}</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-4 text-white shadow-lg shadow-violet-200/50">
                  <div className="flex justify-between items-center">
                    <span className="text-violet-100">Return Amount</span>
                    <span className="text-2xl font-bold">{formatCurrency(totalReturnAmount)}</span>
                  </div>
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

                <div className="flex items-start gap-2 text-xs text-slate-600 rounded-xl border border-violet-100 bg-violet-50/50 p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-violet-600" />
                  <span>{refundHint}</span>
                </div>

                <Button
                  onClick={handleCreateReturn}
                  className={cn('w-full', purchaseBtnPrimary)}
                  size="lg"
                  disabled={saving || loadingItems}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Return
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push('/purchases/returns')}
                  className={cn('w-full', purchaseBtnSecondary)}
                >
                  Cancel
                </Button>
              </div>
            </ColorCard>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
