"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency } from "@/utils/constant";
import { Combobox } from "@/components/ui/combobox";
import { productsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function ProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    brand: "",
    model: "",
  });

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getAll({ limit: "100" });
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await productsApi.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch categories");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const filteredProducts = products.filter(
    (product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddDialog = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category: "",
      brand: "",
      model: "",
    });
    setShowAddDialog(true);
  };

  const handleOpenEditDialog = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      category: product.category || "",
      brand: product.brand || "",
      model: product.model || "",
    });
    setShowAddDialog(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name) {
      toast({
        title: "Validation Error",
        description: "Please select or enter an Item Name",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const toTitleCase = (str: string) =>
        str
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
          .trim();

      const name = formData.name ? toTitleCase(formData.name) : "";
      const brand = formData.brand ? toTitleCase(formData.brand) : "";
      const model = formData.model ? toTitleCase(formData.model) : "";

      const itemCategory = [name, brand, model]
        .filter(Boolean)
        .join(" - ");

      const productData: any = {
        name,
        category: itemCategory,
        brand,
        model,
      };

      if (editingProduct) {
        await productsApi.update(editingProduct._id, productData);
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        await productsApi.create(productData);
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }

      setShowAddDialog(false);
      setEditingProduct(null);
      fetchProducts();
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await productsApi.delete(id);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  // Build unique item name options from existing products
  const itemNameOptions = Array.from(
    new Set(products.map((p) => p.name).filter(Boolean))
  ).map((name) => ({ value: name, label: name }));

  const handleItemNameChange = (value: string) => {
    setFormData({ ...formData, name: value });
  };

  const handleCreateItemName = (newName: string) => {
    setFormData({ ...formData, name: newName });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Products</h1>
            <p className="text-slate-600">Manage your product catalog</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Item Name *</Label>
                  <Combobox
                    options={itemNameOptions}
                    value={formData.name}
                    onValueChange={handleItemNameChange}
                    placeholder="Search or create item name"
                    searchPlaceholder="Search items..."
                    emptyText="No items found"
                    allowCreate
                    onCreateNew={handleCreateItemName}
                  />
                </div>

                <div>
                  <Label>Brand</Label>
                  <Input
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    placeholder="e.g., Apple, Samsung"
                  />
                </div>

                <div>
                  <Label>Model</Label>
                  <Input
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    placeholder="e.g., 15 Pro Max"
                  />
                </div>

                <Button onClick={handleSaveProduct} className="w-full" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingProduct ? "Update Product" : "Add Product"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Product List</CardTitle>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search products..."
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
                    <TableHead>Item Code</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>IMEI</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Purchase Price</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const hasSellingPrice = product.sellingPrice != null && product.sellingPrice > 0;
                    const profit = hasSellingPrice ? product.sellingPrice - product.purchasePrice : null;

                    return (
                    <TableRow key={product._id}>
                      <TableCell>
                        {product.category || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {product.name}
                          {profit !== null && profit > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                              <TrendingUp className="w-3 h-3" />
                            </span>
                          )}
                          {profit !== null && profit < 0 && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                              <TrendingDown className="w-3 h-3" />
                            </span>
                          )}
                          {profit !== null && profit === 0 && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5">
                              <Minus className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.brand || "-"}</TableCell>
                      <TableCell>{product.model || "-"}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {product.imei || "-"}
                      </TableCell>
                      <TableCell>{product.quantity ?? 0}</TableCell>
                      <TableCell>{product.color || "-"}</TableCell>
                      <TableCell>{formatCurrency(product.purchasePrice)}</TableCell>
                      <TableCell>
                        {product.sellingPrice ? formatCurrency(product.sellingPrice) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditDialog(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product._id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                        No products found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
