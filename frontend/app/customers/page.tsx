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
import { customersApi, suppliersApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/constant';

export default function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showEditCustomer, setShowEditCustomer] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [customersRes, summaryRes, suppliersRes] = await Promise.all([
        customersApi.getAll({ limit: '100' }),
        customersApi.getSummary(),
        suppliersApi.getAll({ limit: '100' }),
      ]);
      if (customersRes.success && customersRes.data) {
        setCustomers(customersRes.data as any[]);
      }
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
      if (suppliersRes.success && suppliersRes.data) {
        setSuppliers(suppliersRes.data as any[]);
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

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
  );

  const handleSaveCustomer = async () => {
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
      await customersApi.create(formData);
      toast({ title: 'Success', description: 'Customer created successfully' });
      setShowAddCustomer(false);
      setFormData({ name: '', phone: '', email: '', address: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save customer',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
    });
    setShowEditCustomer(true);
  };

  const handleUpdateCustomer = async () => {
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
      await customersApi.update(selectedCustomer._id, formData);
      toast({ title: 'Success', description: 'Customer updated successfully' });
      setShowEditCustomer(false);
      setSelectedCustomer(null);
      setFormData({ name: '', phone: '', email: '', address: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update customer',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    setSaving(true);
    try {
      await customersApi.delete(selectedCustomer._id);
      toast({ title: 'Success', description: 'Customer deleted successfully' });
      setShowDeleteDialog(false);
      setSelectedCustomer(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete customer',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReceivePayment = async () => {
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
      await customersApi.receivePayment(
        selectedCustomer._id,
        parseFloat(paymentAmount)
      );
      toast({ title: 'Success', description: 'Payment received successfully' });
      setShowPayment(false);
      setPaymentAmount('');
      setSelectedCustomer(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to receive payment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLinkSupplier = async () => {
    if (!selectedCustomer) return;

    setSaving(true);
    try {
      await customersApi.linkSupplier(
        selectedCustomer._id,
        selectedSupplierId === '__none__' ? null : selectedSupplierId
      );
      toast({
        title: 'Success',
        description:
          selectedSupplierId === '__none__'
            ? 'Supplier unlinked'
            : 'Supplier linked successfully',
      });
      setShowLinkDialog(false);
      setSelectedSupplierId('');
      setSelectedCustomer(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to link supplier',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getAvailableSuppliers = () => {
    const linkedSupplierIds = customers
      .filter((c) => c.linkedSupplier && c._id !== selectedCustomer?._id)
      .map((c) =>
        typeof c.linkedSupplier === 'object'
          ? c.linkedSupplier._id
          : c.linkedSupplier
      );
    return suppliers.filter((s: any) => !linkedSupplierIds.includes(s._id));
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
            <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
            <p className="text-slate-600">
              Manage customer information and linked accounts
            </p>
          </div>
          <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Customer name"
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
                  onClick={handleSaveCustomer}
                  className="w-full"
                  disabled={saving}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Customer
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
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '-' : summary?.totalCustomers || customers.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Receivables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {loading
                  ? '-'
                  : formatCurrency(summary?.totalReceivables || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Customers with Credit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '-' : summary?.customersWithCredit || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Sales Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading
                  ? '-'
                  : formatCurrency(summary?.totalSalesValue || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Customer List</CardTitle>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search customers..."
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
                    <TableHead>Receivable</TableHead>
                    <TableHead>Linked Supplier</TableHead>
                    <TableHead>Net Balance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const linked = customer.linkedSupplier;
                    const receivable = customer.outstanding || 0;
                    const payable = linked?.outstanding || 0;
                    const net = receivable - payable;

                    return (
                      <TableRow key={customer._id}>
                        <TableCell className="font-medium">
                          {customer.name}
                        </TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell>
                          {formatCurrency(customer.totalPurchases || 0)}
                        </TableCell>
                        <TableCell>
                          {receivable > 0 ? (
                            <span className="text-orange-600 font-medium">
                              {formatCurrency(receivable)}
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
                                <span className="text-green-600 font-medium">
                                  They owe {formatCurrency(net)}
                                </span>
                              ) : net < 0 ? (
                                <span className="text-red-600 font-medium">
                                  You owe {formatCurrency(Math.abs(net))}
                                </span>
                              ) : (
                                <span className="text-slate-500">Settled</span>
                              )}
                              <div className="text-xs text-slate-400 mt-0.5">
                                Receivable: {formatCurrency(receivable)} |
                                Payable: {formatCurrency(payable)}
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
                              onClick={() => handleEditCustomer(customer)}
                              title="Edit customer"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setSelectedSupplierId(
                                  linked?._id || '__none__'
                                );
                                setShowLinkDialog(true);
                              }}
                              title="Link to supplier"
                            >
                              {linked ? (
                                <Link2Off className="w-4 h-4 text-purple-600" />
                              ) : (
                                <Link2 className="w-4 h-4 text-purple-600" />
                              )}
                            </Button>
                            {customer.outstanding > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setShowPayment(true);
                                }}
                                title="Receive payment"
                              >
                                <DollarSign className="w-4 h-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setShowDeleteDialog(true);
                              }}
                              title="Delete customer"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredCustomers.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-slate-500"
                      >
                        No customers found
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
              <DialogTitle>Receive Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Customer</Label>
                <Input value={selectedCustomer?.name || ''} disabled />
              </div>
              <div>
                <Label>Outstanding Amount</Label>
                <Input
                  value={formatCurrency(selectedCustomer?.outstanding || 0)}
                  disabled
                />
              </div>
              <div>
                <Label>Receiving Amount</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                />
              </div>
              <Button
                onClick={handleReceivePayment}
                className="w-full"
                disabled={saving}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Record Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Customer Dialog */}
        <Dialog open={showEditCustomer} onOpenChange={setShowEditCustomer}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Customer name"
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
                onClick={handleUpdateCustomer}
                className="w-full"
                disabled={saving}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Link Supplier Dialog */}
        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Link Customer to Supplier
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
                If this customer is also your supplier (same person/company),
                link them to auto-track net balance. Their receivable and payable
                will be shown as a single net amount and can be settled from the
                Suppliers page.
              </div>
              <div>
                <Label>Customer</Label>
                <Input value={selectedCustomer?.name || ''} disabled />
              </div>
              <div>
                <Label>Link to Supplier</Label>
                <Select
                  value={selectedSupplierId}
                  onValueChange={setSelectedSupplierId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a supplier..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      -- No Link (Remove) --
                    </SelectItem>
                    {getAvailableSuppliers().map((s: any) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.name} ({s.phone})
                        {s.outstanding > 0
                          ? ` - Payable: ${formatCurrency(s.outstanding)}`
                          : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleLinkSupplier}
                className="w-full"
                disabled={saving}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {selectedSupplierId === '__none__'
                  ? 'Remove Link'
                  : 'Link Supplier'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Customer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{' '}
                <strong>{selectedCustomer?.name}</strong>? This action cannot be
                undone.
                {selectedCustomer?.outstanding > 0 && (
                  <span className="block mt-2 text-orange-600">
                    Warning: This customer has an outstanding balance of{' '}
                    {formatCurrency(selectedCustomer?.outstanding)}.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCustomer}
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
