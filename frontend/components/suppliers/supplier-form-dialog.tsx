'use client';

import { Loader2, Building2, User, Phone, Mail, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const supplierBtnPrimary =
  'rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 border-0 shadow-lg shadow-purple-300/30';

const supplierBtnSecondary =
  'rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50';

export type SupplierFormData = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

type SupplierFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  form: SupplierFormData;
  onFormChange: (form: SupplierFormData) => void;
  onSave: () => void;
  saving?: boolean;
};

function Field({
  id,
  label,
  required,
  icon: Icon,
  ...inputProps
}: {
  id: string;
  label: string;
  required?: boolean;
  icon: typeof User;
} & React.ComponentProps<typeof Input>) {
  return (
    <div>
      <Label htmlFor={id} className="text-slate-700">
        {label}
        {required ? ' *' : ''}
      </Label>
      <div className="relative mt-1.5">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
        <Input
          id={id}
          className="rounded-xl border-slate-200 bg-slate-50/50 pl-10 focus:bg-white"
          {...inputProps}
        />
      </div>
    </div>
  );
}

export function SupplierFormDialog({
  open,
  onOpenChange,
  editing,
  form,
  onFormChange,
  onSave,
  saving = false,
}: SupplierFormDialogProps) {
  const update = (patch: Partial<SupplierFormData>) => onFormChange({ ...form, ...patch });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl shadow-purple-200/40',
          '[&>button]:text-white/80 [&>button]:hover:bg-white/10 [&>button]:hover:text-white'
        )}
      >
        <div className="bg-gradient-to-br from-fuchsia-600 via-purple-600 to-violet-700 px-6 pb-6 pt-8 text-white">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                {editing ? 'Edit Supplier' : 'Add New Supplier'}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-purple-100">
                {editing
                  ? 'Update supplier contact details and address.'
                  : 'Create a supplier profile for purchases and payables.'}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-white p-6">
          <Field
            id="supplier-name"
            label="Name"
            required
            icon={User}
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Supplier name"
          />
          <Field
            id="supplier-phone"
            label="Phone"
            required
            icon={Phone}
            value={form.phone}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="Phone number"
          />
          <Field
            id="supplier-email"
            label="Email"
            icon={Mail}
            type="email"
            value={form.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="Email address (optional)"
          />
          <Field
            id="supplier-address"
            label="Address"
            icon={MapPin}
            value={form.address}
            onChange={(e) => update({ address: e.target.value })}
            placeholder="Address (optional)"
          />
        </div>

        <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={cn('flex-1', supplierBtnSecondary)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            className={cn('flex-1', supplierBtnPrimary)}
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? 'Update Supplier' : 'Save Supplier'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
