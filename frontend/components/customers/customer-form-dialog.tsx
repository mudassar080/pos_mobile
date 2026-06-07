'use client';

import { Loader2, User, Phone, Mail, MapPin } from 'lucide-react';
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

const customerBtnPrimary =
  'rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 border-0 shadow-lg shadow-rose-300/30';

const customerBtnSecondary =
  'rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50';

export type CustomerFormData = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

type CustomerFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  form: CustomerFormData;
  onFormChange: (form: CustomerFormData) => void;
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
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-400" />
        <Input
          id={id}
          className="rounded-xl border-slate-200 bg-slate-50/50 pl-10 focus:bg-white"
          {...inputProps}
        />
      </div>
    </div>
  );
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  editing,
  form,
  onFormChange,
  onSave,
  saving = false,
}: CustomerFormDialogProps) {
  const update = (patch: Partial<CustomerFormData>) => onFormChange({ ...form, ...patch });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl shadow-rose-200/40',
          '[&>button]:text-white/80 [&>button]:hover:bg-white/10 [&>button]:hover:text-white'
        )}
      >
        <div className="bg-gradient-to-br from-pink-600 via-rose-600 to-red-700 px-6 pb-6 pt-8 text-white">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <User className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                {editing ? 'Edit Customer' : 'Add New Customer'}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-rose-100">
                {editing
                  ? 'Update customer contact details and address.'
                  : 'Create a customer profile for sales and receivables.'}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-white p-6">
          <Field
            id="customer-name"
            label="Name"
            required
            icon={User}
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Customer name"
          />
          <Field
            id="customer-phone"
            label="Phone"
            required
            icon={Phone}
            value={form.phone}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="Phone number"
          />
          <Field
            id="customer-email"
            label="Email"
            icon={Mail}
            type="email"
            value={form.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="Email address (optional)"
          />
          <Field
            id="customer-address"
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
            className={cn('flex-1', customerBtnSecondary)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            className={cn('flex-1', customerBtnPrimary)}
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? 'Update Customer' : 'Save Customer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
