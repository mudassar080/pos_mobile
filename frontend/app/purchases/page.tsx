'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
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
import { Plus, Loader2, Eye } from 'lucide-react';
import Link from 'next/link';
import { purchasesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/constant';

export default function PurchasesPage() {
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await purchasesApi.getAll({ limit: '100', sortOrder: 'desc' });
      if (response.success && response.data) {
        setPurchases(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch purchases',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

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
    return new Date(date).toLocaleDateString();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Purchases</h1>
            <p className="text-slate-600">Manage inventory purchases</p>
          </div>
          <Link href="/purchases/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Purchase
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Purchase History</CardTitle>
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
                    <TableHead>Purchase #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase._id}>
                      <TableCell className="font-medium">{purchase.purchaseNumber}</TableCell>
                      <TableCell>{formatDate(purchase.date)}</TableCell>
                      <TableCell>{purchase.supplierName}</TableCell>
                      <TableCell>{purchase.itemsCount || purchase.items?.length || 0}</TableCell>
                      <TableCell>{formatCurrency(purchase.amount)}</TableCell>
                      <TableCell>{formatCurrency(purchase.paid)}</TableCell>
                      <TableCell className="text-red-600 font-medium">
                        {formatCurrency(purchase.balance || (purchase.amount - purchase.paid))}
                      </TableCell>
                      <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Purchase Details - {purchase.purchaseNumber}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-slate-600">Supplier</p>
                                  <p className="font-medium">{purchase.supplierName}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-600">Date</p>
                                  <p className="font-medium">{formatDate(purchase.date)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-600">Total Amount</p>
                                  <p className="font-medium text-lg">{formatCurrency(purchase.amount)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-600">Payment Status</p>
                                  <p className="font-medium">{getStatusBadge(purchase.status)}</p>
                                </div>
                              </div>
                              <div className="border-t pt-4">
                                <h4 className="font-semibold mb-2">Items</h4>
                                {purchase.items?.map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between text-sm py-1">
                                    <span>
                                      {item.productName} x {item.quantity}
                                    </span>
                                    <span>{formatCurrency(item.total)}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="border-t pt-4">
                                <h4 className="font-semibold mb-2">Payment History</h4>
                                {purchase.paymentHistory && purchase.paymentHistory.length > 0 ? (
                                  <div className="space-y-2">
                                    {[...purchase.paymentHistory]
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
                      </TableCell>
                    </TableRow>
                  ))}
                  {purchases.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                        No purchases found
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
