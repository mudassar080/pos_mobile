'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
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
import { Badge } from '@/components/ui/badge';
import { Search, AlertTriangle, Smartphone, Package, Loader2 } from 'lucide-react';
import { productsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/constant';

export default function StockPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [stockSummary, setStockSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStock = async () => {
    try {
      setLoading(true);
      const [productsRes, lowStockRes, summaryRes] = await Promise.all([
        productsApi.getAll({ limit: '500' }),
        productsApi.getLowStock(),
        productsApi.getStockSummary(),
      ]);
      if (productsRes.success && productsRes.data) {
        setProducts(productsRes.data);
      }
      if (lowStockRes.success && lowStockRes.data) {
        setLowStock(lowStockRes.data);
      }
      if (summaryRes.success && summaryRes.data) {
        setStockSummary(summaryRes.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch stock',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.imei?.includes(searchTerm) ||
      p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (product: any) => {
    if (product.imei) {
      switch (product.status) {
        case 'available':
          return <Badge className="bg-green-600">Available</Badge>;
        case 'sold':
          return <Badge className="bg-blue-600">Sold</Badge>;
        case 'returned':
          return <Badge className="bg-orange-600">Returned</Badge>;
        case 'damaged':
          return <Badge className="bg-red-600">Damaged</Badge>;
        default:
          return <Badge>{product.status}</Badge>;
      }
    }
    if ((product.quantity || 0) <= 0) {
      return <Badge className="bg-red-600">Out of Stock</Badge>;
    }
    if ((product.quantity || 0) <= 5) {
      return <Badge className="bg-orange-600">Low Stock</Badge>;
    }
    return <Badge className="bg-green-600">In Stock</Badge>;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Stock Management</h1>
          <p className="text-slate-600">Manage phone and accessory inventory</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Phones Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {loading ? '-' : stockSummary?.phones?.available || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Accessories Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? '-' : stockSummary?.accessories?.totalQuantity || 0}
              </div>
              <p className="text-sm text-slate-600">
                {stockSummary?.accessories?.totalProducts || 0} products
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Stock Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '-' : formatCurrency(stockSummary?.totalValue || 0)}
              </div>
              <p className="text-sm text-slate-600">
                Sale Value: {loading ? '-' : formatCurrency(stockSummary?.totalSellingValue || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {loading ? '-' : lowStock.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Stock Inventory ({filteredProducts.length})</CardTitle>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name, IMEI, brand, category..."
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
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>IMEI</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Purchase Price</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category || '-'}</TableCell>
                      <TableCell>{product.brand || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {product.imei || '-'}
                      </TableCell>
                      <TableCell>{product.color || '-'}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={
                            !product.imei && (product.quantity || 0) <= 5
                              ? 'text-orange-600 font-bold'
                              : ''
                          }
                        >
                          {product.imei ? (product.status === 'available' ? 1 : 0) : product.quantity || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.purchasePrice || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.sellingPrice ? formatCurrency(product.sellingPrice) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(product)}</TableCell>
                    </TableRow>
                  ))}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-slate-500">
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
