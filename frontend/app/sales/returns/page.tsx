'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Textarea } from '@/components/ui/textarea';
import { Plus, RotateCcw, Loader2, Search, Trash2, Eye } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { saleReturnsApi, salesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, REFUND_METHODS } from '@/utils/constant';

const reasons = ['Defective', 'Wrong Item', 'Not Satisfied', 'Damaged', 'Other'];
const conditions = ['resellable', 'damaged'];

export default function SalesReturnsPage() {
  const { toast } = useToast();
  const [returns, setReturns] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewReturn, setShowNewReturn] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [selectedSale, setSelectedSale] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    sale: '',
    reason: 'Defective',
    refundMethod: 'Cash',
    notes: '',
  });
  const [returnItems, setReturnItems] = useState<any[]>([]);

  // Fetch returns
  const fetchReturns = async () => {
    try {
      setLoading(true);
      const [returnsRes, summaryRes] = await Promise.all([
        saleReturnsApi.getAll({ limit: '100', sortOrder: 'desc' }),
        saleReturnsApi.getSummary(),
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
        description: 'Failed to fetch sale returns',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch sales for the dropdown
  const fetchSales = async () => {
    try {
      const response = await salesApi.getAll({ limit: '100' });
      if (response.success && response.data) {
        setSales(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch sales');
    }
  };

  useEffect(() => {
    fetchReturns();
    fetchSales();
  }, []);

  const filteredReturns = returns.filter(
    (ret) =>
      ret.returnNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaleChange = (saleId: string) => {
    const sale = sales.find((s) => s._id === saleId);
    setSelectedSale(sale);
    setFormData({ ...formData, sale: saleId });

    // Pre-populate return items from sale items
    if (sale?.items) {
      setReturnItems(
        sale.items.map((item: any) => ({
          product: item.product?._id || item.product,
          productName: item.productName,
          imei: item.imei,
          quantity: 0,
          maxQuantity: item.quantity,
          price: item.price,
          returnPrice: item.price,
          purchasePrice: item.product?.purchasePrice ?? 0,
          condition: 'resellable',
          selected: false,
        }))
      );
    }
  };

  const handleItemToggle = (index: number, checked: boolean) => {
    const updated = [...returnItems];
    updated[index].selected = checked;
    if (checked && updated[index].quantity === 0) {
      updated[index].quantity = updated[index].maxQuantity;
    }
    setReturnItems(updated);
  };

  const handleItemQuantityChange = (index: number, quantity: number) => {
    const updated = [...returnItems];
    updated[index].quantity = Math.min(quantity, updated[index].maxQuantity);
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
    if (isNaN(num) || num < 0) {
      updated[index].returnPrice = 0;
    } else {
      updated[index].returnPrice = Math.min(num, updated[index].price);
    }
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
      setShowNewReturn(false);
      resetForm();
      fetchReturns();
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

  const handleDeleteReturn = async () => {
    if (!selectedReturn) return;

    setSaving(true);
    try {
      await saleReturnsApi.delete(selectedReturn._id);
      toast({
        title: 'Success',
        description: 'Sale return deleted successfully',
      });
      setShowDeleteDialog(false);
      setSelectedReturn(null);
      fetchReturns();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete sale return',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      sale: '',
      reason: 'Defective',
      refundMethod: 'Cash',
      notes: '',
    });
    setReturnItems([]);
    setSelectedSale(null);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getReasonBadge = (reason: string) => {
    const colors: Record<string, string> = {
      Defective: 'bg-red-100 text-red-800',
      'Wrong Item': 'bg-orange-100 text-orange-800',
      'Not Satisfied': 'bg-yellow-100 text-yellow-800',
      Damaged: 'bg-purple-100 text-purple-800',
      Other: 'bg-slate-100 text-slate-800',
    };
    return <Badge className={colors[reason] || 'bg-slate-100'}>{reason}</Badge>;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Sales Returns</h1>
            <p className="text-slate-600">Manage product returns from customers</p>
          </div>
          <Link href="/sales/returns/new">
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              New Return
            </Button>
          </Link>
          <Dialog open={showNewReturn} onOpenChange={setShowNewReturn}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Process Sales Return</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Invoice *</Label>
                  <Select value={formData.sale} onValueChange={handleSaleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      {sales.map((sale) => (
                        <SelectItem key={sale._id} value={sale._id}>
                          {sale.invoiceNumber} - {sale.customerName} (
                          {formatCurrency(sale.amount)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSale && returnItems.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Select Items to Return</Label>
                    <div className="border rounded-lg p-4 space-y-3">
                      {returnItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={item.selected}
                              onCheckedChange={(checked) =>
                                handleItemToggle(index, checked as boolean)
                              }
                            />
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-sm text-slate-600">
                                {item.imei ? `IMEI: ${item.imei}` : `Available: ${item.maxQuantity}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {!item.imei && (
                              <div className="flex items-center gap-2">
                                <Label className="text-sm">Qty:</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max={item.maxQuantity}
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleItemQuantityChange(index, parseInt(e.target.value) || 0)
                                  }
                                  className="w-16"
                                  disabled={!item.selected}
                                />
                              </div>
                            )}
                            {item.selected && (
                              <div className="flex items-center gap-2">
                                <Label className="text-sm">Return Price:</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max={item.price}
                                  value={item.returnPrice ?? item.price}
                                  onChange={(e) =>
                                    handleItemReturnPriceChange(index, e.target.value)
                                  }
                                  className="w-24"
                                  placeholder={String(item.price)}
                                />
                              </div>
                            )}
                            <Select
                              value={item.condition}
                              onValueChange={(value) => handleItemConditionChange(index, value)}
                              disabled={!item.selected}
                            >
                              <SelectTrigger className="w-32">
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
                            <p className="font-medium w-24 text-right text-slate-600">
                              Sale: {formatCurrency(item.price)}
                            </p>
                            {item.selected && (
                              <p className="font-medium w-24 text-right text-slate-500">
                                Purchase: {formatCurrency(item.purchasePrice ?? 0)}
                              </p>
                            )}
                            {item.selected && (() => {
                              const costImpact = ((item.purchasePrice ?? 0) - (item.returnPrice ?? item.price)) * item.quantity;
                              return (
                                <p
                                  className={`text-sm font-medium w-24 text-right ${
                                    costImpact >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}
                                >
                                  {costImpact >= 0 ? 'Profit' : 'Loss'}: {formatCurrency(Math.abs(costImpact))}
                                </p>
                              );
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

                {returnItems.some((i) => i.selected && i.quantity > 0) && (() => {
                  const totalCostImpact = returnItems
                    .filter((i) => i.selected && i.quantity > 0)
                    .reduce(
                      (sum, i) =>
                        sum + ((i.purchasePrice ?? 0) - (i.returnPrice ?? i.price)) * i.quantity,
                      0
                    );
                  return (
                    <div className="rounded-lg border bg-slate-50 p-4 space-y-2">
                      <p className="text-sm font-medium text-slate-700">
                        Total Refund:{' '}
                        <span className="font-semibold">
                          {formatCurrency(
                            returnItems
                              .filter((i) => i.selected && i.quantity > 0)
                              .reduce((sum, i) => sum + (i.returnPrice ?? i.price) * i.quantity, 0)
                          )}
                        </span>
                      </p>
                      <p className="text-sm font-medium text-slate-700">
                        Cost Impact (vs purchase price):{' '}
                        <span
                          className={`font-semibold ${
                            totalCostImpact >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {totalCostImpact >= 0 ? 'Profit' : 'Loss'}{' '}
                          {formatCurrency(Math.abs(totalCostImpact))}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Purchase price is kept; next sale uses original cost basis.
                      </p>
                    </div>
                  );
                })()}

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
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Process Return
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

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
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Refund</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.map((ret) => (
                    <TableRow key={ret._id}>
                      <TableCell className="font-medium">{ret.returnNumber}</TableCell>
                      <TableCell>{ret.invoiceNumber}</TableCell>
                      <TableCell>{formatDate(ret.date)}</TableCell>
                      <TableCell>{ret.customerName}</TableCell>
                      <TableCell>{ret.itemsCount || ret.items?.length || 0}</TableCell>
                      <TableCell>{formatCurrency(ret.amount)}</TableCell>
                      <TableCell>
                        <span className={(ret.profit || 0) >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {formatCurrency(ret.profit || 0)}
                        </span>
                      </TableCell>
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
                      <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                        No sale returns found
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
                  <p className="text-sm text-slate-600">Invoice</p>
                  <p className="font-medium">{selectedReturn?.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Customer</p>
                  <p className="font-medium">{selectedReturn?.customerName}</p>
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
                  <p className="text-sm text-slate-600">Cost Impact (vs purchase)</p>
                  <p className={`font-medium text-lg ${(selectedReturn?.costImpact ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(selectedReturn?.costImpact ?? 0) >= 0 ? 'Profit ' : 'Loss '}
                    {formatCurrency(Math.abs(selectedReturn?.costImpact ?? 0))}
                  </p>
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
                        <TableHead>Purchase</TableHead>
                        <TableHead>Sold</TableHead>
                        <TableHead>Return</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead className="text-right">Loss/Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReturn?.items?.map((item: any, idx: number) => {
                        const costImpact = item.costImpact ?? 0;
                        return (
                        <TableRow key={idx}>
                          <TableCell>
                            <span className="font-medium">{item.productName}</span>
                            {item.imei && <span className="text-xs text-slate-500 ml-1">({item.imei})</span>}
                            <Badge variant="outline" className="ml-2 text-xs">{item.condition}</Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(item.purchasePrice ?? 0)}</TableCell>
                          <TableCell>{formatCurrency(item.originalPrice || item.price)}</TableCell>
                          <TableCell>{formatCurrency(item.returnPrice || item.price)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            <span className={costImpact >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {costImpact >= 0 ? 'Profit ' : 'Loss '}{formatCurrency(Math.abs(costImpact))}
                            </span>
                          </TableCell>
                        </TableRow>
                      );})}
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
              <AlertDialogTitle>Delete Sale Return</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete return{' '}
                <strong>{selectedReturn?.returnNumber}</strong>? This will reverse the product
                stock changes and customer balance adjustments. This action cannot be undone.
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
