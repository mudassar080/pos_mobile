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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  DollarSign,
  Loader2,
  Edit,
  Trash2,
  Link2,
  Link2Off,
  ArrowLeftRight,
  Users,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { suppliersApi, customersApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/constant';

export default function SuppliersPage() {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showEditSupplier, setShowEditSupplier] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showSettleDialog, setShowSettleDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suppliersRes, summaryRes, customersRes] = await Promise.all([
        suppliersApi.getAll({ limit: '100' }),
        suppliersApi.getSummary(),
        customersApi.getAll({ limit: '100' }),
      ]);
      if (suppliersRes.success && suppliersRes.data) {
        setSuppliers(suppliersRes.data as any[]);
      }
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
      if (customersRes.success && customersRes.data) {
        setCustomers(customersRes.data as any[]);
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

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone?.includes(searchTerm)
  );

  const handleSaveSupplier = async () => {
    if (!formData.name || !formData.phone) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in name and phone',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await suppliersApi.create(formData);
      toast({ title: 'Success', description: 'Supplier created successfully' });
      setShowAddSupplier(false);
      setFormData({ name: '', phone: '', email: '', address: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save supplier',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditSupplier = (supplier: any) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
    });
    setShowEditSupplier(true);
  };

  const handleUpdateSupplier = async () => {
    if (!formData.name || !formData.phone) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in name and phone',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await suppliersApi.update(selectedSupplier._id, formData);
      toast({ title: 'Success', description: 'Supplier updated successfully' });
      setShowEditSupplier(false);
      setSelectedSupplier(null);
      setFormData({ name: '', phone: '', email: '', address: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update supplier',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;

    setSaving(true);
    try {
      await suppliersApi.delete(selectedSupplier._id);
      toast({ title: 'Success', description: 'Supplier deleted successfully' });
      setShowDeleteDialog(false);
      setSelectedSupplier(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete supplier',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMakePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await suppliersApi.makePayment(selectedSupplier._id, parseFloat(paymentAmount));
      toast({ title: 'Success', description: 'Payment made successfully' });
      setShowPayment(false);
      setPaymentAmount('');
      setSelectedSupplier(null);
      fetchData();
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

  const handleLinkCustomer = async () => {
    if (!selectedSupplier) return;

    setSaving(true);
    try {
      await suppliersApi.linkCustomer(
        selectedSupplier._id,
        selectedCustomerId === '__none__' ? null : selectedCustomerId
      );
      toast({
        title: 'Success',
        description:
          selectedCustomerId === '__none__'
            ? 'Customer unlinked'
            : 'Customer linked successfully',
      });
      setShowLinkDialog(false);
      setSelectedCustomerId('');
      setSelectedSupplier(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to link customer',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSettle = async () => {
    if (!selectedSupplier) return;

    setSaving(true);
    try {
      const res = await suppliersApi.settleLinkedBalance(selectedSupplier._id);
      toast({
        title: 'Settled',
        description: (res as any)?.message || 'Balance settled successfully',
      });
      setShowSettleDialog(false);
      setSelectedSupplier(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to settle',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getAvailableCustomers = () => {
    const linkedCustomerIds = suppliers
      .filter((s) => s.linkedCustomer && s._id !== selectedSupplier?._id)
      .map((s) =>
        typeof s.linkedCustomer === 'object'
          ? s.linkedCustomer._id
          : s.linkedCustomer
      );
    return customers.filter((c: any) => !linkedCustomerIds.includes(c._id));
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Suppliers</h1>
            <p className="text-slate-600">
              Manage supplier information and linked accounts
            </p>
          </div>
          <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Supplier</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Supplier name"
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Address"
                  />
                </div>
                <Button
                  onClick={handleSaveSupplier}
                  className="w-full"
                  disabled={saving}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Supplier
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Suppliers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '-' : summary?.totalSuppliers || suppliers.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Payables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {loading
                  ? '-'
                  : formatCurrency(summary?.totalPayables || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Suppliers with Credit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '-' : summary?.suppliersWithCredit || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Purchase Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading
                  ? '-'
                  : formatCurrency(summary?.totalPurchaseValue || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Supplier Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Supplier List</CardTitle>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search suppliers..."
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
                    <TableHead>Phone</TableHead>
                    <TableHead>Total Purchases</TableHead>
                    <TableHead>Payable</TableHead>
                    <TableHead>Linked Customer</TableHead>
                    <TableHead>Net Balance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => {
                    const linked = supplier.linkedCustomer;
                    const payable = supplier.outstanding || 0;
                    const receivable = linked?.outstanding || 0;
                    const net = payable - receivable;

                    return (
                      <TableRow key={supplier._id}>
                        <TableCell className="font-medium">
                          {supplier.name}
                        </TableCell>
                        <TableCell>{supplier.phone}</TableCell>
                        <TableCell>
                          {formatCurrency(supplier.totalPurchases || 0)}
                        </TableCell>
                        <TableCell>
                          {payable > 0 ? (
                            <span className="text-red-600 font-medium">
                              {formatCurrency(payable)}
                            </span>
                          ) : payable < 0 ? (
                            <span className="text-blue-600 font-medium">
                              {formatCurrency(Math.abs(payable))} (They owe you)
                            </span>
                          ) : (
                            <span className="text-green-600">Settled</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {linked ? (
                            <Badge
                              variant="outline"
                              className="border-purple-300 text-purple-700"
                            >
                              <Link2 className="w-3 h-3 mr-1" />
                              {linked.name}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-sm">
                              Not linked
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {linked ? (
                            <div className="text-sm">
                              {net > 0 ? (
                                <span className="text-red-600 font-medium">
                                  You owe {formatCurrency(net)}
                                </span>
                              ) : net < 0 ? (
                                <span className="text-green-600 font-medium">
                                  They owe {formatCurrency(Math.abs(net))}
                                </span>
                              ) : (
                                <span className="text-slate-500">Settled</span>
                              )}
                              <div className="text-xs text-slate-400 mt-0.5">
                                Payable: {formatCurrency(payable)} | Receivable:{' '}
                                {formatCurrency(receivable)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSupplier(supplier)}
                              title="Edit supplier"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setSelectedCustomerId(
                                  linked?._id || '__none__'
                                );
                                setShowLinkDialog(true);
                              }}
                              title="Link to customer"
                            >
                              {linked ? (
                                <Link2Off className="w-4 h-4 text-purple-600" />
                              ) : (
                                <Link2 className="w-4 h-4 text-purple-600" />
                              )}
                            </Button>
                            {linked &&
                              ((payable > 0 && receivable > 0) || payable < 0) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSupplier(supplier);
                                    setShowSettleDialog(true);
                                  }}
                                  title={payable < 0 ? "Transfer credit to receivable" : "Settle balance"}
                                >
                                  <ArrowLeftRight className="w-4 h-4 text-orange-600" />
                                </Button>
                              )}
                            {supplier.outstanding > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedSupplier(supplier);
                                  setShowPayment(true);
                                }}
                                title="Make payment"
                              >
                                <DollarSign className="w-4 h-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setShowDeleteDialog(true);
                              }}
                              title="Delete supplier"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredSuppliers.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-slate-500"
                      >
                        No suppliers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={showPayment} onOpenChange={setShowPayment}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Make Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Supplier</Label>
                <Input value={selectedSupplier?.name || ''} disabled />
              </div>
              <div>
                <Label>Outstanding Amount</Label>
                <Input
                  value={formatCurrency(selectedSupplier?.outstanding || 0)}
                  disabled
                />
              </div>
              <div>
                <Label>Payment Amount</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                />
              </div>
              <Button
                onClick={handleMakePayment}
                className="w-full"
                disabled={saving}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Make Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Supplier Dialog */}
        <Dialog open={showEditSupplier} onOpenChange={setShowEditSupplier}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Supplier name"
                />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Email address"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Address"
                />
              </div>
              <Button
                onClick={handleUpdateSupplier}
                className="w-full"
                disabled={saving}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Supplier
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Link Customer Dialog */}
        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Link Supplier to Customer
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
                If this supplier is also your customer (same person/company),
                link them to auto-track net balance. Their payable and
                receivable will be shown as a single net amount and can be
                settled together.
              </div>
              <div>
                <Label>Supplier</Label>
                <Input value={selectedSupplier?.name || ''} disabled />
              </div>
              <div>
                <Label>Link to Customer</Label>
                <Select
                  value={selectedCustomerId}
                  onValueChange={setSelectedCustomerId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      -- No Link (Remove) --
                    </SelectItem>
                    {getAvailableCustomers().map((c: any) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name} ({c.phone})
                        {c.outstanding > 0
                          ? ` - Receivable: ${formatCurrency(c.outstanding)}`
                          : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleLinkCustomer}
                className="w-full"
                disabled={saving}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {selectedCustomerId === '__none__'
                  ? 'Remove Link'
                  : 'Link Customer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settle Balance Dialog */}
        <AlertDialog open={showSettleDialog} onOpenChange={setShowSettleDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-orange-600" />
                  Settle Linked Balance
                </div>
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  {selectedSupplier && (() => {
                    const pay = selectedSupplier.outstanding || 0;
                    const recv = selectedSupplier.linkedCustomer?.outstanding || 0;
                    const isNegativePayable = pay < 0;

                    if (isNegativePayable) {
                      const transferAmt = Math.abs(pay);
                      return (
                        <>
                          <p>
                            Supplier has a <strong>credit balance</strong> (they owe you). 
                            This will transfer that amount as receivable to the linked customer account.
                          </p>
                          <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Supplier credit (they owe you):</span>
                              <span className="font-medium text-blue-600">
                                {formatCurrency(transferAmt)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Current customer receivable:</span>
                              <span className="font-medium text-green-600">
                                {formatCurrency(recv)}
                              </span>
                            </div>
                            <hr />
                            <div className="flex justify-between font-medium">
                              <span>Transfer to receivable:</span>
                              <span className="text-orange-600">
                                {formatCurrency(transferAmt)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>After settlement:</span>
                              <span>
                                Supplier payable: {formatCurrency(0)} | Customer receivable: {formatCurrency(recv + transferAmt)}
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    }

                    const settleAmt = Math.min(pay, recv);
                    return (
                      <>
                        <p>
                          This will net off the payable (what you owe the supplier)
                          against the receivable (what the customer owes you).
                        </p>
                        <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Payable (you owe supplier):</span>
                            <span className="font-medium text-red-600">
                              {formatCurrency(pay)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Receivable (customer owes you):</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(recv)}
                            </span>
                          </div>
                          <hr />
                          <div className="flex justify-between font-medium">
                            <span>Settlement amount:</span>
                            <span className="text-orange-600">
                              {formatCurrency(settleAmt)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>After settlement:</span>
                            <span>
                              Payable: {formatCurrency(Math.max(0, pay - recv))} | Receivable: {formatCurrency(Math.max(0, recv - pay))}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSettle}
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Settle Now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{' '}
                <strong>{selectedSupplier?.name}</strong>? This action cannot be
                undone.
                {selectedSupplier?.outstanding > 0 && (
                  <span className="block mt-2 text-red-600">
                    Warning: You have an outstanding balance of{' '}
                    {formatCurrency(selectedSupplier?.outstanding)} to this
                    supplier.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSupplier}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
