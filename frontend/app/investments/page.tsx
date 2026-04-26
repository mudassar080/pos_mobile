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
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Loader2,
  UserPlus,
  Users,
  Trash2,
  Edit,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { investmentsApi, ownersApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/constant';
import moment from 'moment';

export default function InvestmentsPage() {
  const { toast } = useToast();
  const [investments, setInvestments] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddOwner, setShowAddOwner] = useState(false);
  const [filterOwner, setFilterOwner] = useState('all');

  // Transaction form state
  const [formData, setFormData] = useState({
    owner: '',
    type: 'investment',
    amount: '',
    date: moment().format('YYYY-MM-DD'),
    description: '',
  });

  // Owner form state
  const [ownerForm, setOwnerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [editingOwner, setEditingOwner] = useState<any>(null);
  const [savingOwner, setSavingOwner] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [investmentsRes, summaryRes, ownersRes] = await Promise.all([
        investmentsApi.getAll({ limit: '200', sortOrder: 'desc' }),
        investmentsApi.getSummary(),
        ownersApi.getAll(),
      ]);
      if (investmentsRes.success && investmentsRes.data) {
        setInvestments(investmentsRes.data);
      }
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
      if (ownersRes.success && ownersRes.data) {
        setOwners(ownersRes.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveTransaction = async () => {
    if (!formData.owner || !formData.type || !formData.amount) {
      toast({
        title: 'Validation Error',
        description: 'Please select an owner and fill in type and amount',
        variant: 'destructive',
      });
      return;
    }

    const selectedOwner = owners.find((o) => o._id === formData.owner);
    if (!selectedOwner) {
      toast({
        title: 'Validation Error',
        description: 'Please select a valid owner',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await investmentsApi.create({
        ...formData,
        ownerName: selectedOwner.name,
        amount: parseFloat(formData.amount),
        date: moment(formData.date, 'YYYY-MM-DD').startOf('day').toDate(),
      });
      toast({
        title: 'Success',
        description: 'Transaction added successfully',
      });
      setShowAddTransaction(false);
      setFormData({
        owner: '',
        type: 'investment',
        amount: '',
        date: moment().format('YYYY-MM-DD'),
        description: '',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save transaction',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOwner = async () => {
    if (!ownerForm.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Owner name is required',
        variant: 'destructive',
      });
      return;
    }

    setSavingOwner(true);
    try {
      if (editingOwner) {
        await ownersApi.update(editingOwner._id, ownerForm);
        toast({ title: 'Success', description: 'Owner updated successfully' });
      } else {
        await ownersApi.create(ownerForm);
        toast({ title: 'Success', description: 'Owner created successfully' });
      }
      setShowAddOwner(false);
      setEditingOwner(null);
      setOwnerForm({ name: '', phone: '', email: '', address: '', notes: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save owner',
        variant: 'destructive',
      });
    } finally {
      setSavingOwner(false);
    }
  };

  const handleEditOwner = (owner: any) => {
    setEditingOwner(owner);
    setOwnerForm({
      name: owner.name || '',
      phone: owner.phone || '',
      email: owner.email || '',
      address: owner.address || '',
      notes: owner.notes || '',
    });
    setShowAddOwner(true);
  };

  const handleDeleteOwner = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this owner?')) return;
    try {
      await ownersApi.delete(id);
      toast({ title: 'Success', description: 'Owner deleted successfully' });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete owner',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const filteredInvestments =
    filterOwner === 'all'
      ? investments
      : investments.filter(
          (inv) => inv.owner?._id === filterOwner || inv.owner === filterOwner
        );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Owner Management</h1>
            <p className="text-slate-600">Manage owners and track investments &amp; withdrawals</p>
          </div>
          <div className="flex gap-2">
            <Dialog
              open={showAddOwner}
              onOpenChange={(open) => {
                setShowAddOwner(open);
                if (!open) {
                  setEditingOwner(null);
                  setOwnerForm({ name: '', phone: '', email: '', address: '', notes: '' });
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Owner
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingOwner ? 'Edit Owner' : 'Add New Owner'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={ownerForm.name}
                      onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })}
                      placeholder="Enter owner name"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={ownerForm.phone}
                      onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={ownerForm.email}
                      onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input
                      value={ownerForm.address}
                      onChange={(e) => setOwnerForm({ ...ownerForm, address: e.target.value })}
                      placeholder="Enter address"
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={ownerForm.notes}
                      onChange={(e) => setOwnerForm({ ...ownerForm, notes: e.target.value })}
                      placeholder="Add notes"
                      rows={2}
                    />
                  </div>
                  <Button onClick={handleSaveOwner} className="w-full" disabled={savingOwner}>
                    {savingOwner && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingOwner ? 'Update Owner' : 'Create Owner'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Investment / Withdrawal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Owner *</Label>
                    <Select
                      value={formData.owner}
                      onValueChange={(value) => setFormData({ ...formData, owner: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {owners.map((owner) => (
                          <SelectItem key={owner._id} value={owner._id}>
                            {owner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {owners.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        No owners found. Please add an owner first.
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="withdrawal">Withdrawal</SelectItem>
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
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Add description"
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleSaveTransaction}
                    className="w-full"
                    disabled={saving || owners.length === 0}
                  >
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Transaction
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Overall Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Investments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {loading ? '-' : formatCurrency(summary?.totalInvestments || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                {loading ? '-' : formatCurrency(summary?.totalWithdrawals || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Net Owner Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '-' : formatCurrency(summary?.netBalance || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Per-Owner Breakdown */}
        {summary?.byOwner && summary.byOwner.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Owner-wise Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.byOwner.map((ownerData: any) => (
                  <div
                    key={ownerData.ownerId}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <h3 className="font-semibold text-slate-900">{ownerData.ownerName}</h3>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Invested</span>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(ownerData.totalInvestments)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Withdrawn</span>
                      <span className="text-red-600 font-medium">
                        {formatCurrency(ownerData.totalWithdrawals)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-slate-700 font-medium">Balance</span>
                      <span
                        className={`font-bold ${
                          ownerData.netBalance >= 0 ? 'text-slate-900' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(ownerData.netBalance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Owners List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Owners ({owners.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : owners.length === 0 ? (
              <p className="text-center py-8 text-slate-500">
                No owners yet. Click &quot;Add Owner&quot; to create one.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {owners.map((owner) => (
                    <TableRow key={owner._id}>
                      <TableCell className="font-medium">{owner.name}</TableCell>
                      <TableCell>{owner.phone || '-'}</TableCell>
                      <TableCell>{owner.email || '-'}</TableCell>
                      <TableCell>{owner.address || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditOwner(owner)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteOwner(owner._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transaction History</CardTitle>
              <Select value={filterOwner} onValueChange={setFilterOwner}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  {owners.map((owner) => (
                    <SelectItem key={owner._id} value={owner._id}>
                      {owner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <TableHead>Date</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvestments.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>{formatDate(item.date)}</TableCell>
                      <TableCell className="font-medium">
                        {item.ownerName || item.owner?.name || '-'}
                      </TableCell>
                      <TableCell className="capitalize">{item.type}</TableCell>
                      <TableCell>{item.description || '-'}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          item.type === 'investment' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {item.type === 'investment' ? '+' : '-'}
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredInvestments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        No transactions found
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
