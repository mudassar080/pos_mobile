'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { purchaseReturnsApi, purchasesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, REFUND_METHODS } from '@/utils/constant';
import { Combobox } from '@/components/ui/combobox';

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
      const response = await purchasesApi.getAll({ limit: '300' });
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Create Purchase Return</h1>
            <p className="text-slate-600">Return items to suppliers and adjust payables</p>
          </div>
          <Link href="/purchases/returns">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>New Return</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  placeholder={loadingPurchases ? 'Loading purchases...' : 'Search purchase...'}
                  searchPlaceholder="Search by number, supplier, amount..."
                  emptyText="No purchases found"
                />
              </div>

              {selectedPurchase && loadingItems && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              )}

              {selectedPurchase && !loadingItems && returnItems.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
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
                        const itemTotal = item.quantity > 0 ? item.returnPrice * item.quantity : 0;
                        const fullyReturned = item.maxQuantity <= 0;
                        return (
                          <TableRow key={index} className={fullyReturned ? 'opacity-50' : ''}>
                            <TableCell>
                              <span className="font-medium">{item.productName}</span>
                              {item.alreadyReturned > 0 && (
                                <span className="block text-xs text-orange-600">
                                  {item.alreadyReturned} of {item.originalPurchaseQty} already returned
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm">{item.imei || '-'}</TableCell>
                            <TableCell>{formatCurrency(item.price)}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={item.returnPrice}
                                onChange={(e) =>
                                  handleItemReturnPriceChange(index, parseFloat(e.target.value) || 0)
                                }
                                className="w-24"
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
                                    handleItemQuantityChange(index, parseInt(e.target.value) || 0)
                                  }
                                  className="w-20"
                                  disabled={fullyReturned}
                                />
                                <span className="text-xs text-slate-400">/{item.maxQuantity}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(itemTotal)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Purchase:</span>
                  <span className="font-medium">{selectedPurchase?.purchaseNumber || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Supplier:</span>
                  <span className="font-medium">{selectedPurchase?.supplierName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Outstanding:</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(selectedPurchase?.balance || 0)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-slate-600">Selected Items:</span>
                  <span className="font-medium">{selectedItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Return Amount:</span>
                  <span className="font-semibold">{formatCurrency(totalReturnAmount)}</span>
                </div>
              </div>

              <div>
                <Label>Reason *</Label>
                <Select
                  value={formData.reason}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, reason: value }))}
                >
                  <SelectTrigger>
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
                  <SelectTrigger>
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
                />
              </div>

              <div className="flex items-start gap-2 text-xs text-slate-500 rounded-md border p-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  {formData.refundMethod === 'Credit' && (
                    <>
                      Return amount of <strong>{formatCurrency(totalReturnAmount)}</strong> will be
                      credited against supplier payable.
                    </>
                  )}
                  {formData.refundMethod === 'Cash' && (
                    <>
                      Supplier will refund <strong>{formatCurrency(totalReturnAmount)}</strong> in cash.
                    </>
                  )}
                  {formData.refundMethod === 'Replacement' && (
                    <>Items will be replaced by supplier. No financial adjustment to payable.</>
                  )}
                </span>
              </div>

              <Button
                onClick={handleCreateReturn}
                className="w-full"
                disabled={saving || loadingPurchases || loadingItems}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Return
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
