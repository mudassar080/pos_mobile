'use client';

import { useState, useEffect, useRef } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Save, Loader2, Info, Package, ShoppingBag, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ColorCard,
  PURCHASE_GRADIENT,
  SalesPageHero,
  STAT_GRID_CLASS,
  SummaryStat,
  purchaseBtnPrimary,
  purchaseBtnSecondary,
  AddSupplierDialog,
} from '@/components/purchases/purchases-ui';
import { useParams, useRouter } from 'next/navigation';
import { formatCurrency } from '@/utils/constant';
import { productsApi, suppliersApi, purchasesApi, purchaseReturnsApi } from '@/lib/api';
import { paginatedParams } from '@/lib/pagination';
import { useToast } from '@/hooks/use-toast';
import { Combobox } from '@/components/ui/combobox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ProductNameCell,
  LineItemBrandCell,
  LineItemModelCell,
  LineItemCategoryCell,
} from '@/components/line-items/line-item-table-cells';

interface PurchaseItem {
  id: string;
  product: any;
  imei?: string;
  quantity: number;
  price: number;
  total: number;
}

export default function EditPurchasePage() {
  const router = useRouter();
  const params = useParams();
  const purchaseId = params.id as string;
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [purchaseNumber, setPurchaseNumber] = useState('');
  const [linesLocked, setLinesLocked] = useState(false);
  const [supplier, setSupplier] = useState<any>(null);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [imei, setImei] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Ref to prevent double-click issues
  const addingItemRef = useRef(false);

  const toTitleCase = (str: string) =>
    str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();

  // Add Product Modal state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    model: '',
  });

  // Add Supplier Modal state
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const fetchData = async () => {
    if (!purchaseId) return;
    try {
      const [purchaseRes, returnedRes, productsRes, suppliersRes, categoriesRes] =
        await Promise.all([
          purchasesApi.getById(purchaseId),
          purchaseReturnsApi.getReturnedQuantities(purchaseId),
          productsApi.getAll(paginatedParams(500)),
          suppliersApi.getAll(paginatedParams(100)),
          productsApi.getCategories(),
        ]);

      if (!purchaseRes.success || !purchaseRes.data) {
        toast({
          title: 'Error',
          description: 'Purchase not found',
          variant: 'destructive',
        });
        router.push('/purchases');
        return;
      }

      const purchase = purchaseRes.data;

      if (purchase.status === 'cancelled') {
        toast({
          title: 'Cannot edit',
          description: 'This purchase is cancelled',
          variant: 'destructive',
        });
        router.push('/purchases');
        return;
      }

      setPurchaseNumber(purchase.purchaseNumber || '');

      const returnedMap = returnedRes.success && returnedRes.data ? returnedRes.data : {};
      const hasReturns = Object.keys(returnedMap).length > 0;
      setLinesLocked(Boolean((purchase.paid || 0) > 0 || hasReturns));

      let productsList = productsRes.success && productsRes.data ? [...productsRes.data] : [];
      (purchase.items || []).forEach((row: any) => {
        const obj =
          typeof row.product === 'object' && row.product !== null ? row.product : null;
        const pid = obj?._id ?? row.product;
        if (pid && !productsList.some((p) => p._id === pid) && obj) {
          productsList = [obj, ...productsList];
        }
      });
      const lineItems: PurchaseItem[] = (purchase.items || []).map(
        (row: any, idx: number) => {
          const rawId =
            typeof row.product === 'object' && row.product !== null
              ? row.product._id
              : row.product;
          const prod =
            productsList.find((p) => p._id === rawId) ||
            (typeof row.product === 'object' && row.product !== null
              ? row.product
              : null);
          return {
            id: `existing-${idx}-${rawId}-${Math.random().toString(36).slice(2)}`,
            product: prod,
            imei: row.imei || undefined,
            quantity: row.quantity,
            price: row.price,
            total: row.total,
          };
        }
      );

      setProducts(productsList);
      if (suppliersRes.success && suppliersRes.data) {
        setSuppliers(suppliersRes.data);
      }
      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }

      const supId =
        typeof purchase.supplier === 'object' && purchase.supplier !== null
          ? purchase.supplier._id
          : purchase.supplier;
      const sup =
        suppliersRes.success && suppliersRes.data
          ? suppliersRes.data.find((s: any) => s._id === supId)
          : null;
      setSupplier(sup || { _id: supId, name: purchase.supplierName });

      setItems(lineItems);
      setNotes(purchase.notes || '');
      const paid =
        purchase.paid != null ? String(purchase.paid) : '';
      setPaidAmount(paid);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load purchase',
        variant: 'destructive',
      });
      router.push('/purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once when id mounts
  }, [purchaseId]);

  const addItem = async () => {
    // Guard against rapid double-clicks
    if (addingItemRef.current) return;
    addingItemRef.current = true;
    setTimeout(() => { addingItemRef.current = false; }, 300);

    if (linesLocked) {
      toast({
        title: 'Items locked',
        description:
          'This purchase has payments or returns. You can only change notes, or remove returns / adjust payments elsewhere first.',
        variant: 'destructive',
      });
      return;
    }

    const product = products.find((p) => p._id === selectedProduct);
    if (!product) {
      toast({
        title: 'Error',
        description: 'Please select a product',
        variant: 'destructive',
      });
      return;
    }

    const price = purchasePrice ? parseFloat(purchasePrice) : (product.purchasePrice || 0);

    if (!price || price <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid purchase price',
        variant: 'destructive',
      });
      return;
    }

    // Prepare product updates (purchase price, sale price, brand, model, item code/category)
    const updatePayload: any = {};
    const purchasePriceVal = parseFloat(purchasePrice);
    if (!isNaN(purchasePriceVal) && purchasePriceVal >= 0 && product.purchasePrice !== purchasePriceVal) {
      updatePayload.purchasePrice = purchasePriceVal;
    }
    if (salePrice) {
      const newSellingPrice = parseFloat(salePrice);
      if (isNaN(newSellingPrice) || newSellingPrice < 0) {
        toast({
          title: 'Error',
          description: 'Please enter a valid sale price',
          variant: 'destructive',
        });
        return;
      }
      if (product.sellingPrice !== newSellingPrice) {
        updatePayload.sellingPrice = newSellingPrice;
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
      if (!product._isTemp) {
        try {
          const response = await productsApi.update(product._id, updatePayload);
          const updatedProduct = response?.data || { ...product, ...updatePayload };
          productForItem = updatedProduct;
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
      } else {
        const updatedProduct = { ...product, ...updatePayload };
        productForItem = updatedProduct;
        setProducts((prev) =>
          prev.map((p) => (p._id === product._id ? updatedProduct : p))
        );
      }
    }

    const trimmedImei = imei.trim() || undefined;

    // If IMEI is provided, check for duplicates
    if (trimmedImei) {
      const existingImei = items.find((item) => item.imei === trimmedImei);
      if (existingImei) {
        toast({
          title: 'Error',
          description: 'This IMEI is already added',
          variant: 'destructive',
        });
        return;
      }

      const newItem: PurchaseItem = {
        id: Date.now().toString(),
        product: productForItem,
        imei: trimmedImei,
        quantity: 1,
        price: price,
        total: price,
      };

      setItems(prev => [...prev, newItem]);
    } else {
      // No IMEI — merge with existing item if same product and same price
      const existingIndex = items.findIndex(
        (item) =>
          item.product &&
          item.product._id === productForItem._id &&
          !item.imei &&
          item.price === price
      );

      if (existingIndex >= 0) {
        setItems(prev => prev.map((item, idx) => {
          if (idx === existingIndex) {
            const newQty = item.quantity + quantity;
            return { ...item, quantity: newQty, total: item.price * newQty };
          }
          return item;
        }));
      } else {
        const newItem: PurchaseItem = {
          id: Date.now().toString(),
          product: productForItem,
          imei: undefined,
          quantity: quantity,
          price: price,
          total: price * quantity,
        };
        setItems(prev => [...prev, newItem]);
      }
    }
    
    setSelectedProduct('');
    setImei('');
    setPurchasePrice('');
    setSalePrice('');
    setBrand('');
    setModel('');
    setQuantity(1);
  };

  const removeItem = (id: string) => {
    if (linesLocked) {
      toast({
        title: 'Items locked',
        description: 'Cannot remove lines while this purchase has payments or returns.',
        variant: 'destructive',
      });
      return;
    }
    setItems(prev => prev.filter((item) => item.id !== id));
  };

  const total = items.reduce((sum, item) => sum + item.total, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSave = async () => {
    if (!supplier) {
      toast({
        title: 'Error',
        description: 'Please select a supplier',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (linesLocked) {
        await purchasesApi.update(purchaseId, { notes });
        toast({
          title: 'Success',
          description: 'Purchase notes updated',
        });
        router.push('/purchases');
        return;
      }

      if (items.length === 0) {
        toast({
          title: 'Error',
          description: 'Please add at least one item',
          variant: 'destructive',
        });
        return;
      }

      for (const item of items) {
        if (!item.product?._id) {
          toast({
            title: 'Error',
            description: 'Every line needs a linked product — reload if data looks wrong.',
            variant: 'destructive',
          });
          return;
        }
      }

      const itemProductIdMap: Record<string, string> = {};
      const accessoryTempMap: Record<string, string> = {};

      for (const item of items) {
        if (!item.product._isTemp) continue;

        const tempId = item.product._id;

        if (item.imei) {
          const productData = {
            name: item.product.name,
            category: item.product.category,
            brand: item.product.brand,
            model: item.product.model,
            imei: item.imei || null,
            color: item.product.color,
            sellingPrice: item.product.sellingPrice,
            purchasePrice: item.price,
            supplier: supplier._id,
          };

          const response = await productsApi.create(productData);
          if (response.data?._id) {
            itemProductIdMap[item.id] = response.data._id;
          } else {
            throw new Error(`Failed to create product: ${item.product.name}`);
          }
        } else {
          if (!accessoryTempMap[tempId]) {
            const productData = {
              name: item.product.name,
              category: item.product.category,
              brand: item.product.brand,
              model: item.product.model,
              color: item.product.color,
              sellingPrice: item.product.sellingPrice,
              purchasePrice: item.price,
            };

            const response = await productsApi.create(productData);
            if (response.data?._id) {
              accessoryTempMap[tempId] = response.data._id;
            } else {
              throw new Error(`Failed to create product: ${item.product.name}`);
            }
          }
          itemProductIdMap[item.id] = accessoryTempMap[tempId];
        }
      }

      await purchasesApi.update(purchaseId, {
        supplier: supplier._id,
        items: items.map((item) => ({
          product: itemProductIdMap[item.id] || item.product._id,
          imei: item.imei || null,
          quantity: item.quantity,
          price: item.price,
        })),
        notes,
      });
      toast({
        title: 'Success',
        description: 'Purchase updated successfully',
      });
      router.push('/purchases');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update purchase',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Supplier form handlers
  const handleSaveSupplier = async () => {
    if (!supplierForm.name || !supplierForm.phone) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in supplier name and phone number',
        variant: 'destructive',
      });
      return;
    }

    setSavingSupplier(true);
    try {
      const response = await suppliersApi.create({
        name: supplierForm.name,
        phone: supplierForm.phone,
        email: supplierForm.email,
        address: supplierForm.address,
      });

      if (response.success && response.data) {
        setSuppliers((prev) => [...prev, response.data]);
        setSupplier(response.data);
        setShowAddSupplier(false);
        setSupplierForm({ name: '', phone: '', email: '', address: '' });
        toast({
          title: 'Success',
          description: 'Supplier created successfully',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create supplier',
        variant: 'destructive',
      });
    } finally {
      setSavingSupplier(false);
    }
  };

  // Build unique item name options from existing products
  const itemNameOptions = Array.from(
    new Set(products.map((p) => p.name).filter(Boolean))
  ).map((name) => ({ value: name, label: name }));

  const buildItemCategory = (name: string, brandValue: string, modelValue: string) =>
    [name, brandValue, modelValue].filter(Boolean).join(' - ');

  const modalCategoryPreview = buildItemCategory(
    productForm.name ? toTitleCase(productForm.name) : '',
    productForm.brand ? toTitleCase(productForm.brand) : '',
    productForm.model ? toTitleCase(productForm.model) : ''
  );

  const selectedProductData = products.find((p) => p._id === selectedProduct);
  const selectedItemCategory = selectedProductData
    ? buildItemCategory(
        selectedProductData.name || '',
        brand.trim() || selectedProductData.brand || '',
        model.trim() || selectedProductData.model || ''
      )
    : '';

  const handleSaveProduct = () => {
    if (!productForm.name) {
      toast({
        title: 'Validation Error',
        description: 'Please select or enter an Item Name',
        variant: 'destructive',
      });
      return;
    }

    const name = toTitleCase(productForm.name);
    const brand = productForm.brand ? toTitleCase(productForm.brand) : '';
    const model = productForm.model ? toTitleCase(productForm.model) : '';
    const itemCategory = [name, brand, model].filter(Boolean).join(' - ');

    // Create a temporary local product (not saved to DB yet)
    const tempId = `temp_${Date.now()}`;
    const tempProduct = {
      _id: tempId,
      _isTemp: true,
      name,
      category: itemCategory,
      brand,
      model,
      purchasePrice: 0,
      quantity: 0,
    };

    // Add to local products list so it appears in dropdown
    setProducts((prev) => [...prev, tempProduct]);

    // Auto-select the new product
    setSelectedProduct(tempId);
    setPurchasePrice('');
    setImei('');
    setQuantity(1);

    // Close modal and reset form
    setShowAddProduct(false);
    setProductForm({ name: '', brand: '', model: '' });

    toast({
      title: 'Product Added',
      description: 'Product will be created when you save the purchase',
    });
  };


  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-36 rounded-3xl bg-gradient-to-r from-blue-200 via-indigo-200 to-violet-200" />
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
          title="Edit Purchase"
          description={
            purchaseNumber
              ? `${purchaseNumber} — Update supplier, lines, or notes`
              : 'Update supplier, lines, or notes'
          }
          badge={purchaseNumber || 'Edit'}
          gradient={PURCHASE_GRADIENT}
          backHref="/purchases"
          actions={
            <Button
              variant="secondary"
              onClick={() => router.push('/purchases')}
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
            theme="bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-900 ring-1 ring-blue-100"
          />
          <SummaryStat
            label="Quantity"
            value={String(totalQuantity)}
            icon={ShoppingBag}
            theme="bg-gradient-to-br from-violet-50 to-purple-100 text-violet-900 ring-1 ring-violet-100"
          />
          <SummaryStat
            label="Total"
            value={formatCurrency(total)}
            icon={DollarSign}
            theme="bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-900 ring-1 ring-indigo-100"
          />
        </div>

        {linesLocked ? (
          <Alert className="rounded-2xl border-indigo-200 bg-indigo-50/80">
            <Info className="h-4 w-4 text-indigo-600" />
            <AlertTitle className="text-indigo-900">Line items and supplier are locked</AlertTitle>
            <AlertDescription className="text-indigo-700">
              This purchase has recorded payments or purchase returns. You can still change notes
              below. To edit lines, remove linked returns first and ensure nothing has been paid
              against this purchase.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <ColorCard
              title="Supplier Details"
              headerClassName="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100/50 text-blue-900"
            >
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1">
                  <Label>Select Supplier *</Label>
                  <Select
                    value={supplier?._id || ''}
                    disabled={linesLocked}
                    onValueChange={(value) => {
                      const sup = suppliers.find((s) => s._id === value);
                      setSupplier(sup);
                    }}
                  >
                    <SelectTrigger className="rounded-xl mt-1.5">
                      <SelectValue placeholder="Choose supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((sup) => (
                        <SelectItem key={sup._id} value={sup._id}>
                          {sup.name} - {sup.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={linesLocked}
                  className={purchaseBtnSecondary}
                  onClick={() => {
                    setSupplierForm({ name: '', phone: '', email: '', address: '' });
                    setShowAddSupplier(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Supplier
                </Button>
              </div>
            </ColorCard>

            <ColorCard
              title="Add Products"
              headerClassName="bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100/50 text-indigo-900"
            >
              {!linesLocked && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(purchaseBtnSecondary, 'mb-4')}
                  onClick={() => {
                    setProductForm({ name: '', brand: '', model: '' });
                    setShowAddProduct(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Product
                </Button>
              )}
              <div className="space-y-4">
                  {!linesLocked ? (
                    <>
                  <div>
                    <Label>Product</Label>
                    <Combobox
                      options={products.map((product) => ({
                        value: product._id,
                        label: `${product.name || ''}${
                          product.brand ? ` | Brand: ${product.brand}` : ''
                        }${product.model ? ` | Model: ${product.model}` : ''}${
                          product.category ? ` | Category: ${product.category}` : ''
                        }${
                          product.sellingPrice
                            ? ` | Sale: ${formatCurrency(product.sellingPrice)}`
                            : ''
                        }${product._isTemp ? ' | ✦ New' : ''}`,
                        displayLabel: product.name || '',
                      }))}
                      value={selectedProduct}
                      onValueChange={(value) => {
                        setSelectedProduct(value);
                        const product = products.find((p) => p._id === value);
                        if (product) {
                          setPurchasePrice(product.purchasePrice?.toString() || '');
                          setSalePrice(product.sellingPrice?.toString() || '');
                          setBrand(product.brand || '');
                          setModel(product.model || '');
                          setImei(product.imei || '');
                          setQuantity(1);
                        } else {
                          setPurchasePrice('');
                          setSalePrice('');
                          setBrand('');
                          setModel('');
                          setImei('');
                          setQuantity(1);
                        }
                      }}
                      placeholder="Search product..."
                      searchPlaceholder="Search by name, brand, model, price..."
                      emptyText="No products found"
                    />
                  </div>

                  {selectedProduct && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4 bg-gradient-to-br from-indigo-50/80 to-blue-50/50 rounded-2xl ring-1 ring-indigo-100">
                        <div>
                          <Label>Purchase Price (PKR) *</Label>
                          <Input
                            type="number"
                            min="0"
                            value={purchasePrice}
                            onChange={(e) => setPurchasePrice(e.target.value)}
                            placeholder="0.00"
                            className="rounded-xl mt-1.5"
                          />
                          {(() => {
                            const prod = products.find((p) => p._id === selectedProduct);
                            const lastPrice = prod?.lastPurchasePrice ?? prod?.purchasePrice;
                            if (lastPrice != null && lastPrice > 0 && !prod?._isTemp) {
                              return (
                                <p className="text-xs text-slate-500 mt-1">
                                  Last purchase: {formatCurrency(lastPrice)}
                                </p>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div>
                          <Label>Sale Price (PKR)</Label>
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
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            className="rounded-xl mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>IMEI Number</Label>
                          <Input
                            value={imei}
                            onChange={(e) => setImei(e.target.value)}
                            placeholder="Enter IMEI (optional)"
                            maxLength={15}
                            className="rounded-xl mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Brand</Label>
                          <Input
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            placeholder="Brand"
                            className="rounded-xl mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Model</Label>
                          <Input
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            placeholder="Model"
                            className="rounded-xl mt-1.5"
                          />
                        </div>
                        <div className="sm:col-span-2 xl:col-span-3">
                          <Label>Category</Label>
                          <Input
                            value={selectedItemCategory || '—'}
                            readOnly
                            className="rounded-xl mt-1.5 bg-white/80 text-slate-700"
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <Button onClick={addItem} className={cn('w-full', purchaseBtnPrimary)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Item
                        </Button>
                      </div>
                    </>
                  )}
                    </>
                  ) : null}

                  {items.length > 0 && (
                    <div className="overflow-x-auto rounded-xl ring-1 ring-indigo-100/70">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50/80">
                            <TableHead>Product</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>IMEI / Qty</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.id} className="hover:bg-indigo-50/20">
                              <TableCell>
                                <ProductNameCell
                                  item={{
                                    product: item.product,
                                    productName: item.product?.name,
                                    imei: item.imei,
                                    purchasePrice: item.price,
                                    sellingPrice: item.product?.sellingPrice,
                                  }}
                                  showViewButton={false}
                                  extra={
                                    item.product?._isTemp ? (
                                      <span className="text-xs text-orange-600 font-medium">(New)</span>
                                    ) : undefined
                                  }
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
                              <TableCell className="font-bold text-indigo-700">{formatCurrency(item.total)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={linesLocked}
                                  onClick={() => removeItem(item.id)}
                                  className="text-red-600 hover:bg-red-50 rounded-lg"
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
              title="Purchase Summary"
              headerClassName="bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100/50 text-indigo-900"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-slate-600">Items</span>
                    <span className="font-semibold">{items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-slate-600">Total Quantity</span>
                    <span className="font-semibold">{totalQuantity}</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-4 text-white shadow-lg shadow-indigo-200/50">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-100">Grand Total</span>
                    <span className="text-2xl font-bold">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </ColorCard>

            <ColorCard
              title="Payment"
              headerClassName="bg-gradient-to-r from-violet-50 to-fuchsia-50 border-violet-100/50 text-violet-900"
            >
              <div className="space-y-4">
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-sm space-y-1">
                  <p>
                    <span className="text-indigo-600">Recorded paid:</span>{' '}
                    <span className="font-semibold text-indigo-900">
                      {formatCurrency(parseFloat(paidAmount || '0') || 0)}
                    </span>
                  </p>
                  <p>
                    <span className="text-indigo-600">Outstanding:</span>{' '}
                    <span className="font-semibold text-rose-700">
                      {formatCurrency(Math.max(0, total - (parseFloat(paidAmount || '0') || 0)))}
                    </span>
                  </p>
                  <p className="text-indigo-500/80 text-xs pt-1">
                    Payments are recorded from the Purchases list (view purchase / pay supplier).
                  </p>
                </div>
                <Button
                  onClick={handleSave}
                  className={cn('w-full', purchaseBtnPrimary)}
                  size="lg"
                  disabled={saving}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  {linesLocked ? 'Save notes' : 'Save changes'}
                </Button>
              </div>
            </ColorCard>
          </div>
        </div>

        <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Item Name *</Label>
                <Combobox
                  options={itemNameOptions}
                  value={productForm.name}
                  onValueChange={(value) =>
                    setProductForm({ ...productForm, name: value })
                  }
                  placeholder="Search or create item name"
                  searchPlaceholder="Search items..."
                  emptyText="No items found"
                  allowCreate
                  onCreateNew={(newName) =>
                    setProductForm({ ...productForm, name: newName })
                  }
                />
              </div>

              <div>
                <Label>Brand</Label>
                <Input
                  value={productForm.brand}
                  onChange={(e) =>
                    setProductForm({ ...productForm, brand: e.target.value })
                  }
                  placeholder="e.g., Apple, Samsung"
                />
              </div>

              <div>
                <Label>Model</Label>
                <Input
                  value={productForm.model}
                  onChange={(e) =>
                    setProductForm({ ...productForm, model: e.target.value })
                  }
                  placeholder="e.g., 15 Pro Max"
                />
              </div>

              <div>
                <Label>Category</Label>
                <Input
                  value={modalCategoryPreview || '—'}
                  readOnly
                  className="bg-slate-50 text-slate-700"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Auto-generated from item name, brand, and model
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddProduct(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProduct}
                  className="flex-1"
                >
                  Save Product
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AddSupplierDialog
          open={showAddSupplier}
          onOpenChange={setShowAddSupplier}
          form={supplierForm}
          onFormChange={setSupplierForm}
          onSave={handleSaveSupplier}
          saving={savingSupplier}
        />
      </div>
    </MainLayout>
  );
}
