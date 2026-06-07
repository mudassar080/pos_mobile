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
  ArrowLeftRight,
  Building2,
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
import { suppliersApi, customersApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/constant';
import {
  ColorCard,
  NewSupplierButton,
  SalesPageHero,
  SUPPLIER_GRADIENT,
  SummaryStat,
} from '@/components/suppliers/suppliers-ui';
import { SupplierFormDialog } from '@/components/suppliers/supplier-form-dialog';
import { MakePaymentDialog } from '@/components/suppliers/make-payment-dialog';
import { LinkCustomerDialog } from '@/components/suppliers/link-customer-dialog';
import { SettleBalanceDialog } from '@/components/suppliers/settle-balance-dialog';

function PayableCell({ payable }: { payable: number }) {
  if (payable > 0) {
    return <span className="font-semibold text-rose-600">{formatCurrency(payable)}</span>;
  }
  if (payable < 0) {
    return (
      <span className="font-semibold text-blue-600">
        {formatCurrency(Math.abs(payable))} (They owe you)
      </span>
    );
  }
  return (
    <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 border-0">Settled</Badge>
  );
}

function NetBalanceCell({
  linked,
  payable,
  receivable,
}: {
  linked: any;
  payable: number;
  receivable: number;
}) {
  if (!linked) {
    return <span className="text-slate-400 text-sm">—</span>;
  }

  const net = payable - receivable;

  return (
    <div className="text-sm">
      {net > 0 ? (
        <span className="font-medium text-rose-700">You owe {formatCurrency(net)}</span>
      ) : net < 0 ? (
        <span className="font-medium text-emerald-700">They owe {formatCurrency(Math.abs(net))}</span>
      ) : (
        <span className="text-slate-500">Settled</span>
      )}
      <div className="text-xs text-slate-400 mt-0.5">
        Payable: {formatCurrency(payable)} · Receivable: {formatCurrency(receivable)}
      </div>
    </div>
  );
}

function SupplierActions({
  supplier,
  linked,
  payable,
  receivable,
  onEdit,
  onLink,
  onSettle,
  onPayment,
  onDelete,
  compact = false,
}: {
  supplier: any;
  linked: any;
  payable: number;
  receivable: number;
  onEdit: () => void;
  onLink: () => void;
  onSettle: () => void;
  onPayment: () => void;
  onDelete: () => void;
  compact?: boolean;
}) {
  const btnClass = compact ? 'h-8 w-8 rounded-xl' : 'rounded-xl';
  const showSettle =
    linked && ((payable > 0 && receivable > 0) || payable < 0);

  return (
    <div className="flex items-center gap-1 flex-wrap justify-end">
      <Button
        variant="ghost"
        size="icon"
        className={`${btnClass} text-purple-700 hover:bg-purple-50`}
        onClick={onEdit}
        title="Edit supplier"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`${btnClass} text-violet-700 hover:bg-violet-50`}
        onClick={onLink}
        title="Link to customer"
      >
        {linked ? <Link2Off className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </Button>
      {showSettle && (
        <Button
          variant="ghost"
          size="icon"
          className={`${btnClass} text-orange-600 hover:bg-orange-50`}
          onClick={onSettle}
          title={payable < 0 ? 'Transfer credit to receivable' : 'Settle balance'}
        >
          <ArrowLeftRight className="h-4 w-4" />
        </Button>
      )}
      {supplier.outstanding > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className={`${btnClass} text-emerald-700 hover:bg-emerald-50`}
          onClick={onPayment}
          title="Make payment"
        >
          <DollarSign className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className={`${btnClass} text-red-600 hover:bg-red-50`}
        onClick={onDelete}
        title="Delete supplier"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

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

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', address: '' });
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddSupplier(true);
  };

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
      resetForm();
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
      resetForm();
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
        typeof s.linkedCustomer === 'object' ? s.linkedCustomer._id : s.linkedCustomer
      );
    return customers.filter((c: any) => !linkedCustomerIds.includes(c._id));
  };

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title="Suppliers"
          description="Manage supplier information and linked accounts"
          badge="Accounts"
          gradient={SUPPLIER_GRADIENT}
          actions={<NewSupplierButton onClick={handleOpenAdd} />}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SummaryStat
            label="Total Suppliers"
            value={loading ? '-' : String(summary?.totalSuppliers || suppliers.length)}
            icon={Building2}
            theme="bg-gradient-to-br from-fuchsia-50 to-purple-100 text-fuchsia-900 ring-1 ring-fuchsia-100"
          />
          <SummaryStat
            label="Total Payables"
            value={loading ? '-' : formatCurrency(summary?.totalPayables || 0)}
            icon={Wallet}
            theme="bg-gradient-to-br from-rose-50 to-red-100 text-rose-900 ring-1 ring-rose-100"
          />
          <SummaryStat
            label="With Credit"
            value={loading ? '-' : String(summary?.suppliersWithCredit || 0)}
            icon={CreditCard}
            theme="bg-gradient-to-br from-purple-50 to-violet-100 text-purple-900 ring-1 ring-purple-100"
          />
          <SummaryStat
            label="Purchase Value"
            value={loading ? '-' : formatCurrency(summary?.totalPurchaseValue || 0)}
            icon={TrendingUp}
            theme="bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-900 ring-1 ring-violet-100"
          />
        </div>

        <ColorCard
          title="Supplier List"
          headerClassName="bg-gradient-to-r from-fuchsia-50 via-purple-50 to-violet-50 border-purple-100/50 text-purple-900"
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
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {filteredSuppliers.map((supplier) => {
                  const linked = supplier.linkedCustomer;
                  const payable = supplier.outstanding || 0;
                  const receivable = linked?.outstanding || 0;

                  return (
                    <div
                      key={supplier._id}
                      className="rounded-2xl border border-purple-100/80 bg-gradient-to-br from-white to-purple-50/30 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-purple-900">{supplier.name}</p>
                          <p className="text-sm text-slate-600">{supplier.phone}</p>
                        </div>
                        <div className="shrink-0">
                          <PayableCell payable={payable} />
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-xs text-slate-500">Total Purchases</p>
                          <p className="font-semibold">
                            {formatCurrency(supplier.totalPurchases || 0)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-violet-50 px-3 py-2">
                          <p className="text-xs text-violet-600">Linked Customer</p>
                          <p className="font-semibold text-violet-800 truncate">
                            {linked?.name || 'Not linked'}
                          </p>
                        </div>
                      </div>

                      {linked && (
                        <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                          <NetBalanceCell
                            linked={linked}
                            payable={payable}
                            receivable={receivable}
                          />
                        </div>
                      )}

                      <div className="mt-3">
                        <SupplierActions
                          supplier={supplier}
                          linked={linked}
                          payable={payable}
                          receivable={receivable}
                          compact
                          onEdit={() => handleEditSupplier(supplier)}
                          onLink={() => {
                            setSelectedSupplier(supplier);
                            setSelectedCustomerId(linked?._id || '__none__');
                            setShowLinkDialog(true);
                          }}
                          onSettle={() => {
                            setSelectedSupplier(supplier);
                            setShowSettleDialog(true);
                          }}
                          onPayment={() => {
                            setSelectedSupplier(supplier);
                            setShowPayment(true);
                          }}
                          onDelete={() => {
                            setSelectedSupplier(supplier);
                            setShowDeleteDialog(true);
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {filteredSuppliers.length === 0 && (
                  <p className="text-center py-8 text-slate-500">No suppliers found</p>
                )}
              </div>

              <div className="hidden lg:block overflow-x-auto rounded-xl ring-1 ring-purple-100/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-fuchsia-50 to-purple-50/80">
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

                      return (
                        <TableRow key={supplier._id} className="hover:bg-purple-50/20">
                          <TableCell className="font-medium text-purple-900">
                            {supplier.name}
                          </TableCell>
                          <TableCell>{supplier.phone}</TableCell>
                          <TableCell>{formatCurrency(supplier.totalPurchases || 0)}</TableCell>
                          <TableCell>
                            <PayableCell payable={payable} />
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
                              payable={payable}
                              receivable={receivable}
                            />
                          </TableCell>
                          <TableCell>
                            <SupplierActions
                              supplier={supplier}
                              linked={linked}
                              payable={payable}
                              receivable={receivable}
                              onEdit={() => handleEditSupplier(supplier)}
                              onLink={() => {
                                setSelectedSupplier(supplier);
                                setSelectedCustomerId(linked?._id || '__none__');
                                setShowLinkDialog(true);
                              }}
                              onSettle={() => {
                                setSelectedSupplier(supplier);
                                setShowSettleDialog(true);
                              }}
                              onPayment={() => {
                                setSelectedSupplier(supplier);
                                setShowPayment(true);
                              }}
                              onDelete={() => {
                                setSelectedSupplier(supplier);
                                setShowDeleteDialog(true);
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredSuppliers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                          No suppliers found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </ColorCard>

        <SupplierFormDialog
          open={showAddSupplier}
          onOpenChange={setShowAddSupplier}
          editing={false}
          form={formData}
          onFormChange={setFormData}
          onSave={handleSaveSupplier}
          saving={saving}
        />

        <SupplierFormDialog
          open={showEditSupplier}
          onOpenChange={setShowEditSupplier}
          editing={true}
          form={formData}
          onFormChange={setFormData}
          onSave={handleUpdateSupplier}
          saving={saving}
        />

        <MakePaymentDialog
          open={showPayment}
          onOpenChange={setShowPayment}
          supplierName={selectedSupplier?.name || ''}
          outstanding={selectedSupplier?.outstanding || 0}
          amount={paymentAmount}
          onAmountChange={setPaymentAmount}
          onSave={handleMakePayment}
          saving={saving}
        />

        <LinkCustomerDialog
          open={showLinkDialog}
          onOpenChange={setShowLinkDialog}
          supplierName={selectedSupplier?.name || ''}
          customerId={selectedCustomerId}
          onCustomerChange={setSelectedCustomerId}
          customers={getAvailableCustomers()}
          onSave={handleLinkCustomer}
          saving={saving}
        />

        <SettleBalanceDialog
          open={showSettleDialog}
          onOpenChange={setShowSettleDialog}
          supplier={selectedSupplier}
          onSettle={handleSettle}
          saving={saving}
        />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{selectedSupplier?.name}</strong>? This
                action cannot be undone.
                {selectedSupplier?.outstanding > 0 && (
                  <span className="block mt-2 text-rose-600">
                    Warning: You have an outstanding balance of{' '}
                    {formatCurrency(selectedSupplier?.outstanding)} to this supplier.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSupplier}
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
