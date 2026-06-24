'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Trash2, Save, User, Loader2, Package, ShoppingBag, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency, PAYMENT_MODES } from '@/utils/constant';
import {
  ProductNameCell,
  LineItemBrandCell,
  LineItemModelCell,
  LineItemCategoryCell,
  LineItemImeiCell,
} from '@/components/line-items/line-item-table-cells';
import { productsApi, customersApi, salesApi } from '@/lib/api';
import { paginatedParams } from '@/lib/pagination';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ColorCard, SalesPageHero, STAT_GRID_CLASS, SummaryStat } from '@/components/sales/sales-ui';
import {
  calculateSaleDiscount,
  type SaleDiscountType,
} from '@/lib/sale-discount';

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
  const [discountType, setDiscountType] = useState<SaleDiscountType>('none');
  const [discountValue, setDiscountValue] = useState('');
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
        productsApi.getAll(paginatedParams(500)),
        customersApi.getAll(paginatedParams(100)),
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

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const pricing = calculateSaleDiscount(
    subtotal,
    discountType,
    parseFloat(discountValue) || 0
  );
  const grandTotal = pricing.amount;
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
        paid: paidAmount ? parseFloat(paidAmount) : grandTotal,
        paymentMode,
        notes,
        discountType: pricing.discountType,
        discountValue: pricing.discountValue,
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
        <div className="space-y-6 animate-pulse">
          <div className="h-36 rounded-3xl bg-gradient-to-r from-cyan-200 via-blue-200 to-indigo-200" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 rounded-2xl bg-slate-100" />
            <div className="h-80 rounded-2xl bg-slate-100" />
          </div>
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
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title="New Sale"
          description="Create a new sale transaction"
          badge="Point of Sale"
          gradient="from-cyan-600 via-blue-600 to-indigo-700"
          backHref="/sales"
          actions={
            <Button
              variant="secondary"
              onClick={() => router.back()}
              className="rounded-xl bg-white/15 text-white hover:bg-white/25 border-0"
            >
              Cancel
            </Button>
          }
        />

        <div className={STAT_GRID_CLASS}>
          <SummaryStat
            label="Items"
            value={String(items.length)}
            icon={Package}
            theme="bg-gradient-to-br from-cyan-50 to-blue-100 text-cyan-900 ring-1 ring-cyan-100"
          />
          <SummaryStat
            label="Quantity"
            value={String(totalQuantity)}
            icon={ShoppingBag}
            theme="bg-gradient-to-br from-violet-50 to-purple-100 text-violet-900 ring-1 ring-violet-100"
          />
          <SummaryStat
            label="Profit / Loss"
            value={`${totalProfitLoss < 0 ? '-' : '+'}${formatCurrency(Math.abs(totalProfitLoss))}`}
            icon={CreditCard}
            theme={
              totalProfitLoss < 0
                ? 'bg-gradient-to-br from-rose-50 to-red-100 text-rose-900 ring-1 ring-rose-100'
                : 'bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-900 ring-1 ring-emerald-100'
            }
          />
          <SummaryStat
            label="Total"
            value={formatCurrency(grandTotal)}
            icon={CreditCard}
            theme="bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-900 ring-1 ring-indigo-100"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <ColorCard
              title="Customer Details"
              headerClassName="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-100/50 text-cyan-900"
            >
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
                    <SelectTrigger className="rounded-xl mt-1.5">
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Add New Customer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl">
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
                          className="rounded-xl mt-1.5"
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
                          className="rounded-xl mt-1.5"
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
                          className="rounded-xl mt-1.5"
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
                          className="rounded-xl mt-1.5"
                        />
                      </div>
                      <Button
                        onClick={handleAddCustomer}
                        className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 border-0"
                        disabled={savingCustomer}
                      >
                        {savingCustomer && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Add Customer
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </ColorCard>

            <ColorCard
              title="Add Products"
              headerClassName="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100/50 text-emerald-900"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="sm:col-span-2 xl:col-span-4">
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
                  <div>
                    <Label>Purchase Price (PKR)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      placeholder={selectedProd?.purchasePrice?.toString() || '0.00'}
                      className="rounded-xl mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Sale Price (PKR) *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="0.00"
                      className="rounded-xl mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Profit / Loss</Label>
                    <div
                      className={cn(
                        'mt-1.5 h-10 rounded-xl border px-3 py-2 text-sm font-semibold flex items-center',
                        previewProfitLoss < 0
                          ? 'border-red-200 bg-gradient-to-r from-red-50 to-rose-50 text-red-700'
                          : 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700'
                      )}
                    >
                      {previewProfitLoss < 0 ? 'Loss: ' : 'Profit: '}
                      {formatCurrency(Math.abs(previewProfitLoss))}
                    </div>
                  </div>
                  <div>
                    {selectedProd?.imei ? (
                      <div>
                        <Label>IMEI Number</Label>
                        <Input
                          value={imei}
                          onChange={(e) => setImei(e.target.value)}
                          placeholder="IMEI number"
                          disabled={!!selectedProd?.imei}
                          className={cn('rounded-xl mt-1.5', selectedProd?.imei && 'bg-slate-50')}
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
                          className="rounded-xl mt-1.5"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Brand</Label>
                    <Input
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder={selectedProd?.brand || 'Brand'}
                      className="rounded-xl mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Model</Label>
                    <Input
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder={selectedProd?.model || 'Model'}
                      className="rounded-xl mt-1.5"
                    />
                  </div>
                </div>
                <Button
                  onClick={addItem}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-0 shadow-md shadow-emerald-200/50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>

                {items.length > 0 && (
                  <>
                    {/* Mobile item cards */}
                    <div className="space-y-2 md:hidden">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <ProductNameCell
                                item={{
                                  product: item.product,
                                  productName: item.product.name,
                                  imei: item.imei,
                                  purchasePrice: item.purchasePrice,
                                  sellingPrice: item.price,
                                }}
                                showViewButton={false}
                              />
                              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600">
                                <span>Brand: <LineItemBrandCell item={{ product: item.product }} /></span>
                                <span>Model: <LineItemModelCell item={{ product: item.product }} /></span>
                                <span>Category: <LineItemCategoryCell item={{ product: item.product }} /></span>
                                <span>IMEI: <LineItemImeiCell item={{ imei: item.imei }} /></span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              className="shrink-0 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                              <p className="text-slate-500">Price</p>
                              <p className="font-semibold">{formatCurrency(item.price)}</p>
                            </div>
                            <div
                              className={cn(
                                'rounded-lg px-2 py-1.5',
                                item.price - item.purchasePrice < 0 ? 'bg-red-50' : 'bg-green-50'
                              )}
                            >
                              <p className="text-slate-500">P/L</p>
                              <p
                                className={cn(
                                  'font-semibold',
                                  item.price - item.purchasePrice < 0 ? 'text-red-600' : 'text-green-600'
                                )}
                              >
                                {item.price - item.purchasePrice < 0 ? '-' : '+'}
                                {formatCurrency(
                                  Math.abs((item.price - item.purchasePrice) * item.quantity)
                                )}
                              </p>
                            </div>
                            <div className="rounded-lg bg-emerald-50 px-2 py-1.5">
                              <p className="text-emerald-600">Total</p>
                              <p className="font-bold text-emerald-800">{formatCurrency(item.total)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto rounded-xl ring-1 ring-slate-200/70">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-slate-50 to-emerald-50/50">
                            <TableHead>Product</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>IMEI / Qty</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Profit / Loss</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.id} className="hover:bg-emerald-50/20">
                              <TableCell>
                                <ProductNameCell
                                  item={{
                                    product: item.product,
                                    productName: item.product.name,
                                    imei: item.imei,
                                    purchasePrice: item.purchasePrice,
                                    sellingPrice: item.price,
                                  }}
                                  showViewButton={false}
                                />
                              </TableCell>
                              <TableCell><LineItemBrandCell item={{ product: item.product }} /></TableCell>
                              <TableCell><LineItemModelCell item={{ product: item.product }} /></TableCell>
                              <TableCell><LineItemCategoryCell item={{ product: item.product }} /></TableCell>
                              <TableCell className="font-mono text-sm">
                                {item.imei ? (
                                  <span className="text-indigo-600">{item.imei}</span>
                                ) : (
                                  `Qty: ${item.quantity}`
                                )}
                              </TableCell>
                              <TableCell>{formatCurrency(item.price)}</TableCell>
                              <TableCell
                                className={
                                  item.price - item.purchasePrice < 0
                                    ? 'font-semibold text-red-600'
                                    : 'font-semibold text-green-600'
                                }
                              >
                                {item.price - item.purchasePrice < 0 ? '-' : '+'}
                                {formatCurrency(
                                  Math.abs((item.price - item.purchasePrice) * item.quantity)
                                )}
                              </TableCell>
                              <TableCell className="font-bold text-emerald-700">
                                {formatCurrency(item.total)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(item.id)}
                                  className="text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </div>
            </ColorCard>

            <ColorCard
              title="Additional Details"
              headerClassName="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100/50 text-amber-900"
            >
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes..."
                  rows={3}
                  className="rounded-xl mt-1.5 resize-none"
                />
              </div>
            </ColorCard>
          </div>

          <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-20 lg:self-start">
            <ColorCard
              title="Sale Summary"
              headerClassName="bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100/50 text-indigo-900"
            >
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-slate-600">Items</span>
                    <span className="font-semibold">{items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-slate-600">Total Quantity</span>
                    <span className="font-semibold">{totalQuantity}</span>
                  </div>
                  <div
                    className={cn(
                      'flex justify-between text-sm rounded-xl px-3 py-2',
                      totalProfitLoss < 0 ? 'bg-red-50' : 'bg-green-50'
                    )}
                  >
                    <span className="text-slate-600">Profit / Loss</span>
                    <span
                      className={
                        totalProfitLoss < 0 ? 'font-bold text-red-600' : 'font-bold text-green-600'
                      }
                    >
                      {totalProfitLoss < 0 ? '-' : '+'}
                      {formatCurrency(Math.abs(totalProfitLoss))}
                    </span>
                  </div>
                  {customer && (
                    <div className="flex justify-between text-sm rounded-xl bg-cyan-50 px-3 py-2">
                      <span className="text-cyan-700">Customer</span>
                      <span className="font-semibold text-cyan-900">{customer.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 space-y-3">
                    <div>
                      <Label className="text-indigo-900">Discount</Label>
                      <Select
                        value={discountType}
                        onValueChange={(value: SaleDiscountType) => {
                          setDiscountType(value);
                          if (value === 'none') setDiscountValue('');
                        }}
                      >
                        <SelectTrigger className="rounded-xl mt-1.5 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No discount</SelectItem>
                          <SelectItem value="amount">Fixed amount</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {discountType !== 'none' && (
                      <div>
                        <Label className="text-indigo-900">
                          {discountType === 'amount' ? 'Discount amount (PKR)' : 'Discount (%)'}
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max={discountType === 'percentage' ? 100 : subtotal}
                          step={discountType === 'percentage' ? '0.01' : '1'}
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          placeholder={discountType === 'amount' ? '0' : '0'}
                          className="rounded-xl mt-1.5 bg-white"
                        />
                      </div>
                    )}
                    {pricing.discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-rose-700 font-medium">
                        <span>Discount applied</span>
                        <span>-{formatCurrency(pricing.discountAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-4 text-white shadow-lg shadow-indigo-200/50">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-100">Grand Total</span>
                    <span className="text-2xl font-bold">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </ColorCard>

            <ColorCard
              title="Payment"
              headerClassName="bg-gradient-to-r from-violet-50 to-fuchsia-50 border-violet-100/50 text-violet-900"
            >
              <div className="space-y-4">
                <div>
                  <Label>Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger className="rounded-xl mt-1.5">
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
                    max={grandTotal}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder={grandTotal.toString()}
                    className="rounded-xl mt-1.5"
                  />
                  <p className="text-sm text-slate-500 mt-1.5">Leave empty for full payment</p>
                  {paidAmount && parseFloat(paidAmount) < grandTotal && (
                    <p className="text-sm font-medium text-orange-600 mt-1.5 rounded-lg bg-orange-50 px-3 py-2">
                      Balance: {formatCurrency(grandTotal - parseFloat(paidAmount))}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleSave}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 border-0 shadow-lg shadow-violet-300/40"
                  size="lg"
                  disabled={saving || items.length === 0}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Save Sale
                </Button>
              </div>
            </ColorCard>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
