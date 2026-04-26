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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { otherIncomeApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, PAYMENT_MODES } from '@/utils/constant';
import moment from 'moment';

const categories = ['Service', 'Commission', 'Old Phone Resale', 'Accessories Repair', 'Other'];

export default function OtherIncomePage() {
  const { toast } = useToast();
  const [incomes, setIncomes] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: moment().format('YYYY-MM-DD'),
    paymentMode: 'Cash',
    description: '',
  });

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const [incomesRes, summaryRes] = await Promise.all([
        otherIncomeApi.getAll({ limit: '100', sortOrder: 'desc' }),
        otherIncomeApi.getSummary(),
      ]);
      if (incomesRes.success && incomesRes.data) {
        setIncomes(incomesRes.data);
      }
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch other income',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  const handleSaveIncome = async () => {
    if (!formData.category || !formData.amount) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in category and amount',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await otherIncomeApi.create({
        ...formData,
        amount: parseFloat(formData.amount),
        date: moment(formData.date, 'YYYY-MM-DD').startOf('day').toDate(),
      });
      toast({
        title: 'Success',
        description: 'Income added successfully',
      });
      setShowAddIncome(false);
      setFormData({
        category: '',
        amount: '',
        date: moment().format('YYYY-MM-DD'),
        paymentMode: 'Cash',
        description: '',
      });
      fetchIncomes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save income',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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
            <h1 className="text-3xl font-bold text-slate-900">Other Income</h1>
            <p className="text-slate-600">Track additional income sources</p>
          </div>
          <Dialog open={showAddIncome} onOpenChange={setShowAddIncome}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Income
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Other Income</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Enter amount"
                    min="0"
                  />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Payment Mode</Label>
                  <Select
                    value={formData.paymentMode}
                    onValueChange={(value) => setFormData({ ...formData, paymentMode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
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
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add description"
                    rows={3}
                  />
                </div>
                <Button onClick={handleSaveIncome} className="w-full" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Income
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Other Income (This Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {loading ? '-' : formatCurrency(summary?.totalIncome || 0)}
              </div>
              <p className="text-sm text-slate-600 mt-2">
                {summary?.totalCount || 0} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Income by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary?.byCategory?.map((cat: any) => (
                  <div key={cat._id} className="flex justify-between items-center">
                    <span className="text-sm">{cat._id}</span>
                    <span className="font-medium text-green-600">{formatCurrency(cat.total)}</span>
                  </div>
                ))}
                {(!summary?.byCategory || summary.byCategory.length === 0) && (
                  <p className="text-sm text-slate-500">No income yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Income</CardTitle>
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
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomes.map((income) => (
                    <TableRow key={income._id}>
                      <TableCell>{formatDate(income.date)}</TableCell>
                      <TableCell>{income.category}</TableCell>
                      <TableCell>{income.description || '-'}</TableCell>
                      <TableCell>{income.paymentMode}</TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(income.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {incomes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        No income found
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
