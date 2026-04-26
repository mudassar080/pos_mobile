'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, ArrowLeft, Loader2, RotateCcw } from 'lucide-react';
import { saleReturnsApi, salesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, REFUND_METHODS } from '@/utils/constant';

const reasons = ['Defective', 'Wrong Item', 'Not Satisfied', 'Damaged', 'Other'];
const conditions = ['resellable', 'damaged'];

export default function NewSalesReturnPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [sales, setSales] = useState<any[]>([]);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loadingSales, setLoadingSales] = useState(true);
  const [formData, setFormData] = useState({
    sale: '',
    reason: 'Defective',
    refundMethod: 'Cash',
    notes: '',
  });
  const [returnItems, setReturnItems] = useState<any[]>([]);

  const fetchSales = async () => {
    try {
      setLoadingSales(true);
      const response = await salesApi.getAll({ limit: '200' });
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

  const handleSaleChange = (saleId: string) => {
    const sale = sales.find((s) => s._id === saleId);
    setSelectedSale(sale);
    setFormData((prev) => ({ ...prev, sale: saleId }));

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
    updated[index].returnPrice = Number.isNaN(num) || num < 0 ? 0 : Math.min(num, updated[index].price);
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
    (sum, item) => sum + ((item.purchasePrice ?? 0) - (item.returnPrice ?? item.price)) * item.quantity,
    0
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Process Sales Return</h1>
            <p className="text-slate-600">Create a new return from an existing sale</p>
          </div>
          <Link href="/sales/returns">
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
                <Label>Select Invoice *</Label>
                <Select value={formData.sale} onValueChange={handleSaleChange} disabled={loadingSales}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingSales ? 'Loading sales...' : 'Choose invoice'} />
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

              {selectedSale && returnItems.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">Sel</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>IMEI</TableHead>
                        <TableHead>Sale Price</TableHead>
                        <TableHead>Return Price</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returnItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Checkbox
                              checked={item.selected}
                              onCheckedChange={(checked) => handleItemToggle(index, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{item.productName}</span>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{item.imei || '-'}</TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max={item.price}
                              value={item.returnPrice ?? item.price}
                              onChange={(e) => handleItemReturnPriceChange(index, e.target.value)}
                              className="w-24"
                              disabled={!item.selected}
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
                              className="w-20"
                              disabled={!item.selected}
                            />
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(
                              item.selected && item.quantity > 0
                                ? (item.returnPrice ?? item.price) * item.quantity
                                : 0
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
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
                  <span className="text-slate-600">Invoice:</span>
                  <span className="font-medium">{selectedSale?.invoiceNumber || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Customer:</span>
                  <span className="font-medium">{selectedSale?.customerName || '-'}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-slate-600">Selected Items:</span>
                  <span className="font-medium">{selectedItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Refund:</span>
                  <span className="font-semibold">{formatCurrency(totalRefund)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Cost Impact:</span>
                  <span className={totalCostImpact >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {totalCostImpact >= 0 ? 'Profit ' : 'Loss '}
                    {formatCurrency(Math.abs(totalCostImpact))}
                  </span>
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
                  {formData.refundMethod === 'Credit' && 'Amount will be adjusted against customer balance.'}
                  {formData.refundMethod === 'Cash' && 'Amount will be refunded in cash to customer.'}
                  {formData.refundMethod === 'Replacement' && 'No cash/credit impact, items will be replaced.'}
                </span>
              </div>

              <Button onClick={handleCreateReturn} className="w-full" disabled={saving || loadingSales}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <RotateCcw className="w-4 h-4 mr-2" />
                Process Return
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
