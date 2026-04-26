'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Loader2, Trash2, Eye, AlertCircle } from 'lucide-react';
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
import { purchaseReturnsApi, purchasesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, REFUND_METHODS } from '@/utils/constant';
import { Combobox } from '@/components/ui/combobox';

const reasons = ['Defective', 'Wrong Item', 'Damaged', 'Expired', 'Other'];

export default function PurchaseReturnsPage() {
  const { toast } = useToast();
  const [returns, setReturns] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddReturn, setShowAddReturn] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [loadingItems, setLoadingItems] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    purchase: '',
    reason: 'Defective',
    refundMethod: 'Credit',
    notes: '',
  });
  const [returnItems, setReturnItems] = useState<any[]>([]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const [returnsRes, summaryRes] = await Promise.all([
        purchaseReturnsApi.getAll({ limit: '100', sortOrder: 'desc' }),
        purchaseReturnsApi.getSummary(),
      ]);
      if (returnsRes.success && returnsRes.data) {
        setReturns(returnsRes.data);
      }
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch purchase returns',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await purchasesApi.getAll({ limit: '200' });
      if (response.success && response.data) {
        // Only show non-cancelled purchases
        setPurchases(response.data.filter((p: any) => p.status !== 'cancelled'));
      }
    } catch (error) {
      console.error('Failed to fetch purchases');
    }
  };

  useEffect(() => {
    fetchReturns();
    fetchPurchases();
  }, []);

  const filteredReturns = returns.filter(
    (ret) =>
      ret.returnNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.purchaseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePurchaseChange = async (purchaseId: string) => {
    const purchase = purchases.find((p) => p._id === purchaseId);
    setSelectedPurchase(purchase);
    setFormData({ ...formData, purchase: purchaseId });

    if (!purchase?.items) {
      setReturnItems([]);
      return;
    }

    setLoadingItems(true);
    try {
      // Fetch already-returned quantities for this purchase
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
            selected: false,
          };
        })
      );
    } catch (error) {
      // Fallback without returned quantities
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
            selected: false,
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
    updated[index].selected = updated[index].quantity > 0;
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
  const totalOriginalAmount = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalProfit = selectedItems.reduce(
    (sum, item) => sum + (item.returnPrice - item.price) * item.quantity,
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
      setShowAddReturn(false);
      resetForm();
      fetchReturns();
      fetchPurchases();
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

  const handleDeleteReturn = async () => {
    if (!selectedReturn) return;

    setSaving(true);
    try {
      await purchaseReturnsApi.delete(selectedReturn._id);
      toast({
        title: 'Success',
        description: 'Purchase return deleted. Stock and supplier balance restored.',
      });
      setShowDeleteDialog(false);
      setSelectedReturn(null);
      fetchReturns();
      fetchPurchases();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete purchase return',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      purchase: '',
      reason: 'Defective',
      refundMethod: 'Credit',
      notes: '',
    });
    setReturnItems([]);
    setSelectedPurchase(null);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getReasonBadge = (reason: string) => {
    const colors: Record<string, string> = {
      Defective: 'bg-red-100 text-red-800',
      'Wrong Item': 'bg-orange-100 text-orange-800',
      Damaged: 'bg-yellow-100 text-yellow-800',
      Expired: 'bg-purple-100 text-purple-800',
      Other: 'bg-slate-100 text-slate-800',
    };
    return <Badge className={colors[reason] || 'bg-slate-100'}>{reason}</Badge>;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Purchase Returns</h1>
            <p className="text-slate-600">Return items to suppliers and adjust payables</p>
          </div>
          <Link href="/purchases/returns/new">
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              New Return
            </Button>
          </Link>
          <Dialog open={showAddReturn} onOpenChange={setShowAddReturn}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Purchase Return</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Select Purchase */}
                <div>
                  <Label>Select Purchase *</Label>
                  <Combobox
                    options={purchases.map((p) => ({
                      value: p._id,
                      label: `${p.purchaseNumber || ''} | ${p.supplierName || ''} | ${formatCurrency(p.amount || 0)}`,
                      displayLabel: p.purchaseNumber || '',
                    }))}
                    value={formData.purchase}
                    onValueChange={handlePurchaseChange}
                    placeholder="Search purchase..."
                    searchPlaceholder="Search by number, supplier, amount..."
                    emptyText="No purchases found"
                  />
                </div>

                {/* Purchase Info */}
                {selectedPurchase && (
                  <div className="bg-slate-50 rounded-lg p-3 border text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Supplier:</span>
                      <span className="font-medium">{selectedPurchase.supplierName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Purchase Amount:</span>
                      <span className="font-medium">{formatCurrency(selectedPurchase.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Paid:</span>
                      <span className="font-medium">{formatCurrency(selectedPurchase.paid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Balance (Payable):</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(selectedPurchase.balance)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Items Selection */}
                {selectedPurchase && loadingItems && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                )}

                {selectedPurchase && !loadingItems && returnItems.length > 0 && (
                  <div>
                    <Label>Select Items to Return</Label>
                    <div className="border rounded-lg mt-2 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Brand / Model</TableHead>
                            <TableHead>IMEI</TableHead>
                            <TableHead>Last Purchase</TableHead>
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
                              <TableRow
                                key={index}
                                className={fullyReturned ? 'opacity-50' : ''}
                              >
                                <TableCell>
                                  <span className="font-medium">{item.productName}</span>
                                  {item.alreadyReturned > 0 && (
                                    <span className="block text-xs text-orange-600">
                                      {item.alreadyReturned} of {item.originalPurchaseQty} already returned
                                    </span>
                                  )}
                                  {fullyReturned && (
                                    <span className="block text-xs text-red-500 font-medium">
                                      Fully returned
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-slate-600">
                                  {[item.brand, item.model].filter(Boolean).join(' / ') || '-'}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {item.imei || '-'}
                                </TableCell>
                                <TableCell className="text-sm text-slate-500">
                                  {item.lastPurchasePrice != null && item.lastPurchasePrice > 0
                                    ? formatCurrency(item.lastPurchasePrice)
                                    : '-'}
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
                                        handleItemQuantityChange(
                                          index,
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                      className="w-20"
                                      disabled={fullyReturned}
                                    />
                                    <span className="text-xs text-slate-400">
                                      /{item.maxQuantity}
                                    </span>
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

                    {/* Summary */}
                    {selectedItems.length > 0 && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg border space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Original cost of returned items:</span>
                          <span className="font-medium">{formatCurrency(totalOriginalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Return amount (from supplier):</span>
                          <span className="font-medium">{formatCurrency(totalReturnAmount)}</span>
                        </div>
                        {totalProfit !== 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Profit/Loss on return:</span>
                            <span
                              className={`font-medium ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {formatCurrency(totalProfit)}
                            </span>
                          </div>
                        )}
                        <div className="border-t pt-2 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Current payable to supplier:</span>
                            <span className="font-medium text-red-600">
                              {formatCurrency(selectedPurchase?.balance || 0)}
                            </span>
                          </div>
                          {formData.refundMethod !== 'Replacement' && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Payable reduced by (return amount):</span>
                              <span className="font-medium text-green-600">
                                - {formatCurrency(totalReturnAmount)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-medium">
                            <span>New payable after return:</span>
                            <span className={
                              formData.refundMethod === 'Replacement'
                                ? ''
                                : ((selectedPurchase?.balance || 0) - totalReturnAmount) < 0
                                  ? 'text-blue-600'
                                  : 'text-red-600'
                            }>
                              {formData.refundMethod === 'Replacement'
                                ? formatCurrency(selectedPurchase?.balance || 0) + ' (no change)'
                                : formatCurrency((selectedPurchase?.balance || 0) - totalReturnAmount)}
                              {formData.refundMethod !== 'Replacement' &&
                                (selectedPurchase?.balance || 0) - totalReturnAmount < 0 &&
                                ' (Supplier owes you)'}
                            </span>
                          </div>
                          <div className="flex items-start gap-2 text-xs text-slate-500 mt-1">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>
                              {formData.refundMethod === 'Credit' && (
                                <>Return amount of <strong>{formatCurrency(totalReturnAmount)}</strong> will be credited against supplier payable.</>
                              )}
                              {formData.refundMethod === 'Cash' && (
                                <>Supplier will refund <strong>{formatCurrency(totalReturnAmount)}</strong> in cash. Payable will also be reduced.</>
                              )}
                              {formData.refundMethod === 'Replacement' && (
                                <>Items will be replaced by supplier. No financial adjustment to payable.</>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reason & Refund Method */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Reason *</Label>
                    <Select
                      value={formData.reason}
                      onValueChange={(value) => setFormData({ ...formData, reason: value })}
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
                      onValueChange={(value) => setFormData({ ...formData, refundMethod: value })}
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
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any notes..."
                    rows={3}
                  />
                </div>

                <Button onClick={handleCreateReturn} className="w-full" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Return
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '-' : summary?.totalReturns || 0}</div>
              <p className="text-sm text-slate-600">
                {formatCurrency(summary?.totalAmount || 0)} total value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                This Month Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {loading ? '-' : summary?.thisMonthReturns || 0}
              </div>
              <p className="text-sm text-slate-600">
                {formatCurrency(summary?.thisMonthAmount || 0)} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Top Reason
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '-' : summary?.byReason?.[0]?._id || 'N/A'}
              </div>
              <p className="text-sm text-slate-600">
                {summary?.byReason?.[0]?.count || 0} returns
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Returns Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Returns History</CardTitle>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search returns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return #</TableHead>
                    <TableHead>Purchase #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Refund</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.map((ret) => (
                    <TableRow key={ret._id}>
                      <TableCell className="font-medium">{ret.returnNumber}</TableCell>
                      <TableCell>{ret.purchaseNumber}</TableCell>
                      <TableCell>{formatDate(ret.date)}</TableCell>
                      <TableCell>{ret.supplierName}</TableCell>
                      <TableCell>{ret.itemsCount || ret.items?.length || 0}</TableCell>
                      <TableCell>{formatCurrency(ret.amount)}</TableCell>
                      <TableCell>{getReasonBadge(ret.reason)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ret.refundMethod}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReturn(ret);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReturn(ret);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredReturns.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                        No purchase returns found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Return Details - {selectedReturn?.returnNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Purchase</p>
                  <p className="font-medium">{selectedReturn?.purchaseNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Supplier</p>
                  <p className="font-medium">{selectedReturn?.supplierName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Date</p>
                  <p className="font-medium">{formatDate(selectedReturn?.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Return Amount</p>
                  <p className="font-medium text-lg">{formatCurrency(selectedReturn?.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Reason</p>
                  <p className="font-medium">{selectedReturn?.reason}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Refund Method</p>
                  <p className="font-medium">{selectedReturn?.refundMethod}</p>
                </div>
              </div>
              {selectedReturn?.notes && (
                <div>
                  <p className="text-sm text-slate-600">Notes</p>
                  <p className="font-medium">{selectedReturn.notes}</p>
                </div>
              )}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Items Returned</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Purchase Price</TableHead>
                        <TableHead>Return Price</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReturn?.items?.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <span className="font-medium">{item.productName}</span>
                            {item.imei && (
                              <span className="text-xs text-slate-500 ml-1">({item.imei})</span>
                            )}
                          </TableCell>
                          <TableCell>{formatCurrency(item.originalPrice || item.price)}</TableCell>
                          <TableCell>{formatCurrency(item.returnPrice || item.price)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Purchase Return</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete return{' '}
                <strong>{selectedReturn?.returnNumber}</strong>? This will restore the product
                stock and reverse the supplier payable adjustment. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteReturn}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
