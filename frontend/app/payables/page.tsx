'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Loader2, Search } from 'lucide-react';
import { purchasesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/constant';

interface Payable {
  _id: string;
  supplier: string;
  supplierId: string;
  purchase: string;
  date: string;
  amount: number;
  paid: number;
  due: number;
  dueDate: string;
  aging: string;
  daysDiff: number;
}

interface Summary {
  totalPayables: number;
  totalPurchased: number;
  aging0to30: number;
  aging30to60: number;
  aging60plus: number;
  totalSuppliers: number;
}

export default function PayablesPage() {
  const { toast } = useToast();
  const [payables, setPayables] = useState<Payable[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPayables = async () => {
    try {
      setLoading(true);
      const response: any = await purchasesApi.getPayables();
      if (response.success) {
        setPayables(response.data || []);
        setSummary(response.summary || null);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch payables',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayables();
  }, []);

  const filteredPayables = payables.filter(
    (p) =>
      p.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.purchase?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMakePayment = async () => {
    if (!selectedPayable || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > selectedPayable.due) {
      toast({
        title: 'Invalid Amount',
        description: `Amount must be between 1 and ${formatCurrency(selectedPayable.due)}`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await purchasesApi.updatePayment(selectedPayable._id, amount);
      toast({
        title: 'Success',
        description: 'Payment made successfully',
      });
      setShowPaymentDialog(false);
      setSelectedPayable(null);
      setPaymentAmount('');
      fetchPayables();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to make payment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getAgingBadge = (aging: string) => {
    if (aging === '0-30 days') {
      return <Badge className="bg-green-600">{aging}</Badge>;
    } else if (aging === '30-60 days') {
      return <Badge className="bg-orange-600">{aging}</Badge>;
    } else {
      return <Badge className="bg-red-600">{aging}</Badge>;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payables</h1>
          <p className="text-slate-600">Track pending payments to suppliers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Payables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {loading ? '-' : formatCurrency(summary?.totalPayables || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                0-30 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? '-' : formatCurrency(summary?.aging0to30 || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                30-60 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {loading ? '-' : formatCurrency(summary?.aging30to60 || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                60+ Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {loading ? '-' : formatCurrency(summary?.aging60plus || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Suppliers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '-' : summary?.totalSuppliers || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Payables Details</CardTitle>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by supplier or purchase..."
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
                    <TableHead>Supplier</TableHead>
                    <TableHead>Purchase #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Aging</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayables.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium">{item.supplier}</TableCell>
                      <TableCell>{item.purchase}</TableCell>
                      <TableCell>{formatDate(item.date)}</TableCell>
                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                      <TableCell>{formatCurrency(item.paid)}</TableCell>
                      <TableCell className="font-medium text-red-600">
                        {formatCurrency(item.due)}
                      </TableCell>
                      <TableCell>{formatDate(item.dueDate)}</TableCell>
                      <TableCell>{getAgingBadge(item.aging)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPayable(item);
                            setPaymentAmount(item.due.toString());
                            setShowPaymentDialog(true);
                          }}
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          Pay
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPayables.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                        No payables found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Make Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Make Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Supplier:</span>
                  <span className="font-medium">{selectedPayable?.supplier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Purchase #:</span>
                  <span className="font-medium">{selectedPayable?.purchase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Amount:</span>
                  <span className="font-medium">
                    {formatCurrency(selectedPayable?.amount || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Already Paid:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(selectedPayable?.paid || 0)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-slate-600 font-medium">Outstanding:</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(selectedPayable?.due || 0)}
                  </span>
                </div>
              </div>

              <div>
                <Label>Payment Amount (PKR)</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedPayable?.due}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Maximum: {formatCurrency(selectedPayable?.due || 0)}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentDialog(false)}
                  className="flex-1"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMakePayment}
                  className="flex-1"
                  disabled={saving}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Make Payment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
