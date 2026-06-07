'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  DollarSign,
  Loader2,
  Edit,
  Trash2,
  Link2,
  Link2Off,
  Users,
  Wallet,
  CreditCard,
  TrendingUp,
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
import {
  ColorCard,
  CUSTOMER_GRADIENT,
  NewCustomerButton,
  SalesPageHero,
  SummaryStat,
} from '@/components/customers/customers-ui';
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
import { ReceivePaymentDialog } from '@/components/customers/receive-payment-dialog';
import { LinkSupplierDialog } from '@/components/customers/link-supplier-dialog';

function NetBalanceCell({
  linked,
  receivable,
  payable,
}: {
  linked: any;
  receivable: number;
  payable: number;
}) {
  if (!linked) {
    return <span className="text-slate-400 text-sm">—</span>;
  }

  const net = receivable - payable;

  return (
    <div className="text-sm">
      {net > 0 ? (
        <span className="font-medium text-emerald-700">They owe {formatCurrency(net)}</span>
      ) : net < 0 ? (
        <span className="font-medium text-rose-700">You owe {formatCurrency(Math.abs(net))}</span>
      ) : (
        <span className="text-slate-500">Settled</span>
      )}
      <div className="text-xs text-slate-400 mt-0.5">
        Receivable: {formatCurrency(receivable)} · Payable: {formatCurrency(payable)}
      </div>
    </div>
  );
}

function CustomerActions({
  customer,
  linked,
  onEdit,
  onLink,
  onPayment,
  onDelete,
  compact = false,
}: {
  customer: any;
  linked: any;
  onEdit: () => void;
  onLink: () => void;
  onPayment: () => void;
  onDelete: () => void;
  compact?: boolean;
}) {
  const btnClass = compact ? 'h-8 w-8 rounded-xl' : 'rounded-xl';

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={`${btnClass} text-rose-700 hover:bg-rose-50`}
        onClick={onEdit}
        title="Edit customer"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`${btnClass} text-violet-700 hover:bg-violet-50`}
        onClick={onLink}
        title="Link to supplier"
      >
        {linked ? <Link2Off className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </Button>
      {customer.outstanding > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className={`${btnClass} text-emerald-700 hover:bg-emerald-50`}
          onClick={onPayment}
          title="Receive payment"
        >
          <DollarSign className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className={`${btnClass} text-red-600 hover:bg-red-50`}
        onClick={onDelete}
        title="Delete customer"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

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

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', address: '' });
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddCustomer(true);
  };

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
      resetForm();
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
      resetForm();
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
      await customersApi.receivePayment(selectedCustomer._id, parseFloat(paymentAmount));
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
        typeof c.linkedSupplier === 'object' ? c.linkedSupplier._id : c.linkedSupplier
      );
    return suppliers.filter((s: any) => !linkedSupplierIds.includes(s._id));
  };

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title="Customers"
          description="Manage customer information and linked accounts"
          badge="Accounts"
          gradient={CUSTOMER_GRADIENT}
          actions={<NewCustomerButton onClick={handleOpenAdd} />}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SummaryStat
            label="Total Customers"
            value={loading ? '-' : String(summary?.totalCustomers || customers.length)}
            icon={Users}
            theme="bg-gradient-to-br from-pink-50 to-rose-100 text-pink-900 ring-1 ring-pink-100"
          />
          <SummaryStat
            label="Receivables"
            value={loading ? '-' : formatCurrency(summary?.totalReceivables || 0)}
            icon={Wallet}
            theme="bg-gradient-to-br from-orange-50 to-amber-100 text-orange-900 ring-1 ring-orange-100"
          />
          <SummaryStat
            label="With Credit"
            value={loading ? '-' : String(summary?.customersWithCredit || 0)}
            icon={CreditCard}
            theme="bg-gradient-to-br from-rose-50 to-red-100 text-rose-900 ring-1 ring-rose-100"
          />
          <SummaryStat
            label="Total Sales"
            value={loading ? '-' : formatCurrency(summary?.totalSalesValue || 0)}
            icon={TrendingUp}
            theme="bg-gradient-to-br from-fuchsia-50 to-pink-100 text-fuchsia-900 ring-1 ring-fuchsia-100"
          />
        </div>

        <ColorCard
          title="Customer List"
          headerClassName="bg-gradient-to-r from-pink-50 via-rose-50 to-red-50 border-rose-100/50 text-rose-900"
        >
          <div className="mb-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
            </div>
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {filteredCustomers.map((customer) => {
                  const linked = customer.linkedSupplier;
                  const receivable = customer.outstanding || 0;
                  const payable = linked?.outstanding || 0;

                  return (
                    <div
                      key={customer._id}
                      className="rounded-2xl border border-rose-100/80 bg-gradient-to-br from-white to-rose-50/30 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-rose-900">{customer.name}</p>
                          <p className="text-sm text-slate-600">{customer.phone}</p>
                        </div>
                        {receivable > 0 ? (
                          <span className="shrink-0 rounded-xl bg-orange-50 px-2.5 py-1 text-sm font-bold text-orange-700 ring-1 ring-orange-100">
                            {formatCurrency(receivable)}
                          </span>
                        ) : (
                          <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 border-0 shrink-0">
                            Settled
                          </Badge>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-xs text-slate-500">Total Purchases</p>
                          <p className="font-semibold">
                            {formatCurrency(customer.totalPurchases || 0)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-violet-50 px-3 py-2">
                          <p className="text-xs text-violet-600">Linked Supplier</p>
                          <p className="font-semibold text-violet-800 truncate">
                            {linked?.name || 'Not linked'}
                          </p>
                        </div>
                      </div>

                      {linked && (
                        <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                          <NetBalanceCell linked={linked} receivable={receivable} payable={payable} />
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-end">
                        <CustomerActions
                          customer={customer}
                          linked={linked}
                          compact
                          onEdit={() => handleEditCustomer(customer)}
                          onLink={() => {
                            setSelectedCustomer(customer);
                            setSelectedSupplierId(linked?._id || '__none__');
                            setShowLinkDialog(true);
                          }}
                          onPayment={() => {
                            setSelectedCustomer(customer);
                            setShowPayment(true);
                          }}
                          onDelete={() => {
                            setSelectedCustomer(customer);
                            setShowDeleteDialog(true);
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {filteredCustomers.length === 0 && (
                  <p className="text-center py-8 text-slate-500">No customers found</p>
                )}
              </div>

              <div className="hidden lg:block overflow-x-auto rounded-xl ring-1 ring-rose-100/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-pink-50 to-rose-50/80">
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

                      return (
                        <TableRow key={customer._id} className="hover:bg-rose-50/20">
                          <TableCell className="font-medium text-rose-900">
                            {customer.name}
                          </TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>{formatCurrency(customer.totalPurchases || 0)}</TableCell>
                          <TableCell>
                            {receivable > 0 ? (
                              <span className="font-semibold text-orange-600">
                                {formatCurrency(receivable)}
                              </span>
                            ) : (
                              <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 border-0">
                                Settled
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {linked ? (
                              <Badge
                                variant="outline"
                                className="rounded-lg border-violet-200 text-violet-700 bg-violet-50"
                              >
                                <Link2 className="w-3 h-3 mr-1" />
                                {linked.name}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-sm">Not linked</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <NetBalanceCell
                              linked={linked}
                              receivable={receivable}
                              payable={payable}
                            />
                          </TableCell>
                          <TableCell>
                            <CustomerActions
                              customer={customer}
                              linked={linked}
                              onEdit={() => handleEditCustomer(customer)}
                              onLink={() => {
                                setSelectedCustomer(customer);
                                setSelectedSupplierId(linked?._id || '__none__');
                                setShowLinkDialog(true);
                              }}
                              onPayment={() => {
                                setSelectedCustomer(customer);
                                setShowPayment(true);
                              }}
                              onDelete={() => {
                                setSelectedCustomer(customer);
                                setShowDeleteDialog(true);
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredCustomers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                          No customers found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </ColorCard>

        <CustomerFormDialog
          open={showAddCustomer}
          onOpenChange={setShowAddCustomer}
          editing={false}
          form={formData}
          onFormChange={setFormData}
          onSave={handleSaveCustomer}
          saving={saving}
        />

        <CustomerFormDialog
          open={showEditCustomer}
          onOpenChange={setShowEditCustomer}
          editing={true}
          form={formData}
          onFormChange={setFormData}
          onSave={handleUpdateCustomer}
          saving={saving}
        />

        <ReceivePaymentDialog
          open={showPayment}
          onOpenChange={setShowPayment}
          customerName={selectedCustomer?.name || ''}
          outstanding={selectedCustomer?.outstanding || 0}
          amount={paymentAmount}
          onAmountChange={setPaymentAmount}
          onSave={handleReceivePayment}
          saving={saving}
        />

        <LinkSupplierDialog
          open={showLinkDialog}
          onOpenChange={setShowLinkDialog}
          customerName={selectedCustomer?.name || ''}
          supplierId={selectedSupplierId}
          onSupplierChange={setSelectedSupplierId}
          suppliers={getAvailableSuppliers()}
          onSave={handleLinkSupplier}
          saving={saving}
        />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Customer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{selectedCustomer?.name}</strong>? This
                action cannot be undone.
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
                className="rounded-xl bg-red-600 hover:bg-red-700"
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
