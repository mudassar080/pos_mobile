'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash2, Save, User, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency, PAYMENT_MODES } from '@/utils/constant';
import { productsApi, customersApi, salesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface SaleItem {
  id: string;
  product: any;
  imei?: string;
  quantity: number;
  price: number;
  purchasePrice: number;
  total: number;
}

export default function NewSalePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customer, setCustomer] = useState<any>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [imei, setImei] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const toTitleCase = (str: string) =>
    str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();

  // Fetch data
  const fetchData = async () => {
    try {
      const [productsRes, customersRes] = await Promise.all([
        productsApi.getAll({ limit: '500' }),
        customersApi.getAll({ limit: '100' }),
      ]);
      if (productsRes.success && productsRes.data) {
        // Filter to only show available products for sale
        const availableProducts = productsRes.data.filter((p: any) => {
          if (p.imei) {
            // IMEI products must be available status
            return p.status === 'available';
          } else {
            // Non-IMEI products must have quantity > 0
            return (p.quantity || 0) > 0 && p.isActive !== false;
          }
        });
        setProducts(availableProducts);
      }
      if (customersRes.success && customersRes.data) {
        setCustomers(customersRes.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getSelectedProduct = () => products.find((p) => p._id === selectedProduct);

  const addItem = async () => {
    const product = getSelectedProduct();
    if (!product) {
      toast({
        title: 'Error',
        description: 'Please select a product',
        variant: 'destructive',
      });
      return;
    }

    const price = salePrice ? parseFloat(salePrice) : product.sellingPrice || 0;

    if (!price || price <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid sale price',
        variant: 'destructive',
      });
      return;
    }

    // Prepare product updates (purchase price, brand, model, item code/category)
    const updatePayload: any = {};
    let itemPurchasePrice = product.purchasePrice || 0;

    if (purchasePrice) {
      const newPurchasePrice = parseFloat(purchasePrice);
      if (isNaN(newPurchasePrice) || newPurchasePrice < 0) {
        toast({
          title: 'Error',
          description: 'Please enter a valid purchase price',
          variant: 'destructive',
        });
        return;
      }

      itemPurchasePrice = newPurchasePrice;

      if (product.purchasePrice !== newPurchasePrice) {
        updatePayload.purchasePrice = newPurchasePrice;
      }
    }

    const brandTrimmed = brand.trim();
    const modelTrimmed = model.trim();

    if (brandTrimmed && brandTrimmed !== (product.brand || '')) {
      updatePayload.brand = toTitleCase(brandTrimmed);
    }

    if (modelTrimmed && modelTrimmed !== (product.model || '')) {
      updatePayload.model = toTitleCase(modelTrimmed);
    }

    const finalName = (product.name || '').trim();
    const finalBrand = (updatePayload.brand ?? product.brand ?? '').toString().trim();
    const finalModel = (updatePayload.model ?? product.model ?? '').toString().trim();
    const itemCategory = [finalName, finalBrand, finalModel].filter(Boolean).join(' - ');

    if (itemCategory && itemCategory !== (product.category || '')) {
      updatePayload.category = itemCategory;
    }

    let productForItem = product;

    if (Object.keys(updatePayload).length > 0) {
      try {
        const response = await productsApi.update(product._id, updatePayload);
        const updatedProduct = response?.data || { ...product, ...updatePayload };

        productForItem = updatedProduct;

        // Update local products state so UI stays in sync
        setProducts((prev) =>
          prev.map((p) => (p._id === product._id ? updatedProduct : p))
        );
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update product details',
          variant: 'destructive',
        });
        return;
      }
    }

    if (productForItem.imei) {
      const productImei = productForItem.imei || imei || null;
      if (!productImei) {
        toast({
          title: 'Error',
          description: 'IMEI number is required',
          variant: 'destructive',
        });
        return;
      }

      // Check if this product is already added
      const alreadyAdded = items.some((item) => item.product._id === productForItem._id);
      if (alreadyAdded) {
        toast({
          title: 'Error',
          description: 'This phone is already added',
          variant: 'destructive',
        });
        return;
      }

      const newItem: SaleItem = {
        id: Date.now().toString(),
        product: productForItem,
        imei: productImei,
        quantity: 1,
        price: price,
        purchasePrice: itemPurchasePrice,
        total: price,
      };

      setItems([...items, newItem]);
    } else {
      // Check stock for accessories
      const availableStock = productForItem.quantity || 0;
      const alreadyAddedQty = items
        .filter((item) => item.product._id === productForItem._id)
        .reduce((sum, item) => sum + item.quantity, 0);

      if (quantity > availableStock - alreadyAddedQty) {
        toast({
          title: 'Error',
          description: `Insufficient stock. Available: ${availableStock - alreadyAddedQty}`,
          variant: 'destructive',
        });
        return;
      }

      const newItem: SaleItem = {
        id: Date.now().toString(),
        product: productForItem,
        imei: undefined,
        quantity: quantity,
        price: price,
        purchasePrice: itemPurchasePrice,
        total: price * quantity,
      };

      setItems([...items, newItem]);
    }

    setSelectedProduct('');
    setImei('');
    setSalePrice('');
    setPurchasePrice('');
    setBrand('');
    setModel('');
    setQuantity(1);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const total = items.reduce((sum, item) => sum + item.total, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalProfitLoss = items.reduce(
    (sum, item) => sum + (item.price - item.purchasePrice) * item.quantity,
    0
  );

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast({
        title: 'Error',
        description: 'Please fill in name and phone number',
        variant: 'destructive',
      });
      return;
    }

    setSavingCustomer(true);
    try {
      const response = await customersApi.create(newCustomer);
      if (response.success && response.data) {
        setCustomers([...customers, response.data]);
        setCustomer(response.data);
        setNewCustomer({ name: '', phone: '', email: '', address: '' });
        setShowAddCustomer(false);
        toast({
          title: 'Success',
          description: 'Customer added successfully',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add customer',
        variant: 'destructive',
      });
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleSave = async () => {
    if (items.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one item',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const saleData = {
        customer: customer?._id || null,
        items: items.map((item) => ({
          product: item.product._id,
          imei: item.imei || null,
          quantity: item.quantity,
          price: item.price,
        })),
        paid: paidAmount ? parseFloat(paidAmount) : total,
        paymentMode,
        notes,
      };

      await salesApi.create(saleData);
      toast({
        title: 'Success',
        description: 'Sale created successfully',
      });
      router.push('/sales');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create sale',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </MainLayout>
    );
  }

  const selectedProd = getSelectedProduct();
  const maxQuantity = selectedProd
    ? selectedProd.quantity -
      items
        .filter((item) => item.product._id === selectedProd._id)
        .reduce((sum, item) => sum + item.quantity, 0)
    : 1;
  const previewSalePrice = salePrice ? parseFloat(salePrice) : selectedProd?.sellingPrice || 0;
  const previewPurchasePrice = purchasePrice
    ? parseFloat(purchasePrice)
    : selectedProd?.purchasePrice || 0;
  const previewQuantity = selectedProd?.imei ? 1 : quantity;
  const previewProfitLoss =
    !isNaN(previewSalePrice) && !isNaN(previewPurchasePrice)
      ? (previewSalePrice - previewPurchasePrice) * previewQuantity
      : 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">New Sale</h1>
            <p className="text-slate-600">Create a new sale transaction</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Select Customer</Label>
                    <Select
                      value={customer?._id || 'walk-in'}
                      onValueChange={(value) => {
                        if (value === 'walk-in') {
                          setCustomer(null);
                        } else {
                          const cust = customers.find((c) => c._id === value);
                          setCustomer(cust);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose customer or walk-in" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                        {customers.map((cust) => (
                          <SelectItem key={cust._id} value={cust._id}>
                            {cust.name} - {cust.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <User className="w-4 h-4 mr-2" />
                        Add New Customer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Name *</Label>
                          <Input
                            value={newCustomer.name}
                            onChange={(e) =>
                              setNewCustomer({ ...newCustomer, name: e.target.value })
                            }
                            placeholder="Customer name"
                          />
                        </div>
                        <div>
                          <Label>Phone *</Label>
                          <Input
                            value={newCustomer.phone}
                            onChange={(e) =>
                              setNewCustomer({ ...newCustomer, phone: e.target.value })
                            }
                            placeholder="Phone number"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={newCustomer.email}
                            onChange={(e) =>
                              setNewCustomer({ ...newCustomer, email: e.target.value })
                            }
                            placeholder="Email address"
                          />
                        </div>
                        <div>
                          <Label>Address</Label>
                          <Input
                            value={newCustomer.address}
                            onChange={(e) =>
                              setNewCustomer({ ...newCustomer, address: e.target.value })
                            }
                            placeholder="Address"
                          />
                        </div>
                        <Button
                          onClick={handleAddCustomer}
                          className="w-full"
                          disabled={savingCustomer}
                        >
                          {savingCustomer && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Add Customer
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-3">
                      <Label>Product</Label>
                      <Combobox
                        options={products.map((product) => ({
                          value: product._id,
                          label: `${product.name || ''}${
                            product.brand ? ` | Brand: ${product.brand}` : ''
                          }${product.model ? ` | Model: ${product.model}` : ''}${
                            product.sellingPrice
                              ? ` | Sale: ${formatCurrency(product.sellingPrice)}`
                              : ''
                          }`,
                          displayLabel: product.name || '',
                        }))}
                        value={selectedProduct}
                        onValueChange={(value) => {
                          setSelectedProduct(value);
                          const product = products.find((p) => p._id === value);
                          if (product) {
                            setImei(product.imei || '');
                            setSalePrice(product.sellingPrice?.toString() || '');
                            setPurchasePrice(product.purchasePrice?.toString() || '');
                            setBrand(product.brand || '');
                            setModel(product.model || '');
                            setQuantity(1);
                          } else {
                            setPurchasePrice('');
                            setBrand('');
                            setModel('');
                          }
                        }}
                        placeholder="Search product..."
                        searchPlaceholder="Search by name, brand, model, price..."
                        emptyText="No products found"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Purchase Price (PKR)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        placeholder={selectedProd?.purchasePrice?.toString() || '0.00'}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Sale Price (PKR) *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Profit / Loss</Label>
                      <div
                        className={`h-10 rounded-md border px-3 py-2 text-sm font-medium ${
                          previewProfitLoss < 0
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-green-200 bg-green-50 text-green-700'
                        }`}
                      >
                        {previewProfitLoss < 0 ? 'Loss: ' : 'Profit: '}
                        {formatCurrency(Math.abs(previewProfitLoss))}
                      </div>
                    </div>
                    <div className="col-span-3">
                      {selectedProd?.imei ? (
                        <div>
                          <Label>IMEI Number</Label>
                          <Input
                            value={imei}
                            onChange={(e) => setImei(e.target.value)}
                            placeholder="IMEI number"
                            disabled={!!selectedProd?.imei}
                            className={selectedProd?.imei ? 'bg-slate-50' : ''}
                          />
                          {selectedProd?.imei && (
                            <p className="text-xs text-slate-500 mt-1">Auto-filled from product</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <Label>Quantity (Max: {maxQuantity})</Label>
                          <Input
                            type="number"
                            min="1"
                            max={maxQuantity}
                            value={quantity}
                            onChange={(e) =>
                              setQuantity(Math.min(parseInt(e.target.value) || 1, maxQuantity))
                            }
                          />
                        </div>
                      )}
                    </div>
                    <div className="col-span-3">
                      <Label>Brand</Label>
                      <Input
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder={selectedProd?.brand || 'Brand'}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Model</Label>
                      <Input
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder={selectedProd?.model || 'Model'}
                      />
                    </div>
                  </div>
                  <div>
                    <Button onClick={addItem} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  {items.length > 0 && (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>IMEI / Qty</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Profit / Loss</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.product.name}</TableCell>
                              <TableCell className="font-mono text-sm">
                                {item.imei ? (
                                  <span className="text-blue-600">{item.imei}</span>
                                ) : (
                                  `Qty: ${item.quantity}`
                                )}
                              </TableCell>
                              <TableCell>{formatCurrency(item.price)}</TableCell>
                              <TableCell
                                className={
                                  item.price - item.purchasePrice < 0
                                    ? 'font-medium text-red-600'
                                    : 'font-medium text-green-600'
                                }
                              >
                                {item.price - item.purchasePrice < 0 ? '-' : '+'}
                                {formatCurrency(
                                  Math.abs((item.price - item.purchasePrice) * item.quantity)
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(item.total)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(item.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sale Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Items</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Quantity</span>
                    <span>{totalQuantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Profit / Loss</span>
                    <span
                      className={
                        totalProfitLoss < 0 ? 'font-medium text-red-600' : 'font-medium text-green-600'
                      }
                    >
                      {totalProfitLoss < 0 ? '-' : '+'}
                      {formatCurrency(Math.abs(totalProfitLoss))}
                    </span>
                  </div>
                  {customer && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Customer</span>
                      <span className="font-medium">{customer.name}</span>
                    </div>
                  )}
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODES.map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {mode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Paid Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    max={total}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder={total.toString()}
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Leave empty for full payment
                  </p>
                  {paidAmount && parseFloat(paidAmount) < total && (
                    <p className="text-sm text-orange-600 mt-1">
                      Balance: {formatCurrency(total - parseFloat(paidAmount))}
                    </p>
                  )}
                </div>
                <Button onClick={handleSave} className="w-full" size="lg" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Save Sale
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
