'use client';

import { useState, useEffect } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Filter, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { salesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/constant';

export default function SalesPage() {
  const { toast } = useToast();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await salesApi.getAll({ limit: '100', sortOrder: 'desc' });
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
      setLoading(false);
    }
  };

  const handleDelete = async (sale: any) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete sale ${sale.invoiceNumber}?\n\nThis will restore all linked products back to available status.`
    );
    if (!confirmed) return;

    setDeletingId(sale._id);
    try {
      const response = await salesApi.delete(sale._id);
      if (response.success) {
        toast({
          title: 'Sale Deleted',
          description: `${sale.invoiceNumber} deleted and products restored`,
        });
        await fetchSales();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete sale',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const filteredSales = sales.filter(
    (sale) =>
      sale.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-600">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-orange-600">Partial</Badge>;
      case 'credit':
        return <Badge className="bg-red-600">Credit</Badge>;
      case 'cancelled':
        return <Badge className="bg-slate-600">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Sales</h1>
            <p className="text-slate-600">Manage all sales transactions</p>
          </div>
          <Link href="/sales/new">
            <Button size="lg">
              <Plus className="w-4 h-4 mr-2" />
              New Sale
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Sales List</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by invoice or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
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
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                      <TableCell>{formatDate(sale.date)}</TableCell>
                      <TableCell>{sale.customerName}</TableCell>
                      <TableCell>{sale.itemsCount || sale.items?.length || 0}</TableCell>
                      <TableCell>{formatCurrency(sale.amount)}</TableCell>
                      <TableCell>{formatCurrency(sale.paid)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{sale.paymentMode}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(sale.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedSale(sale)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Sale Details - {sale.invoiceNumber}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-slate-600">Customer</p>
                                    <p className="font-medium">{sale.customerName}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-slate-600">Date</p>
                                    <p className="font-medium">{formatDate(sale.date)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-slate-600">Total Amount</p>
                                    <p className="font-medium text-lg">
                                      {formatCurrency(sale.amount)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-slate-600">Payment Status</p>
                                    <p className="font-medium">{getStatusBadge(sale.status)}</p>
                                  </div>
                                </div>
                                <div className="border-t pt-4">
                                  <h4 className="font-semibold mb-2">Items</h4>
                                  {sale.items?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-sm py-1">
                                      <span>{item.productName} x {item.quantity}</span>
                                      <span>{formatCurrency(item.total)}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="border-t pt-4">
                                  <h4 className="font-semibold mb-2">Payment History</h4>
                                  {sale.paymentHistory && sale.paymentHistory.length > 0 ? (
                                    <div className="space-y-2">
                                      {[...sale.paymentHistory]
                                        .sort(
                                          (a: any, b: any) =>
                                            new Date(b.date).getTime() - new Date(a.date).getTime()
                                        )
                                        .map((payment: any, idx: number) => (
                                          <div
                                            key={idx}
                                            className="flex items-center justify-between rounded-md border p-2 text-sm"
                                          >
                                            <div>
                                              <p className="font-medium">
                                                {formatCurrency(payment.amount)} ({payment.paymentMode || 'Cash'})
                                              </p>
                                              <p className="text-slate-500">
                                                {payment.note || payment.source || 'Payment'}
                                              </p>
                                            </div>
                                            <span className="text-slate-500">
                                              {payment.date ? formatDate(payment.date) : '-'}
                                            </span>
                                          </div>
                                        ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-slate-500">No payment history available</p>
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(sale)}
                            disabled={deletingId === sale._id}
                          >
                            {deletingId === sale._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-600" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredSales.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                        No sales found
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
