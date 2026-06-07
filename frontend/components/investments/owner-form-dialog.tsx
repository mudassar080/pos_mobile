'use client';

import { Loader2, User, Phone, Mail, MapPin, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { investmentBtnPrimary, investmentBtnSecondary } from '@/components/investments/investments-ui';

export type OwnerFormData = {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

type OwnerFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  form: OwnerFormData;
  onFormChange: (form: OwnerFormData) => void;
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
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
        <Input
          id={id}
          className="rounded-xl border-slate-200 bg-slate-50/50 pl-10 focus:bg-white"
          {...inputProps}
        />
      </div>
    </div>
  );
}

export function OwnerFormDialog({
  open,
  onOpenChange,
  editing,
  form,
  onFormChange,
  onSave,
  saving = false,
}: OwnerFormDialogProps) {
  const update = (patch: Partial<OwnerFormData>) => onFormChange({ ...form, ...patch });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl shadow-indigo-200/40 max-h-[90vh] overflow-y-auto',
          '[&>button]:text-white/80 [&>button]:hover:bg-white/10 [&>button]:hover:text-white'
        )}
      >
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 px-6 pb-6 pt-8 text-white">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <User className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                {editing ? 'Edit Owner' : 'Add New Owner'}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-indigo-100">
                {editing
                  ? 'Update owner contact details and notes.'
                  : 'Create an owner profile to track investments and withdrawals.'}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-white p-6">
          <Field
            id="owner-name"
            label="Name"
            required
            icon={User}
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Enter owner name"
          />
          <Field
            id="owner-phone"
            label="Phone"
            icon={Phone}
            value={form.phone}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="Enter phone number"
          />
          <Field
            id="owner-email"
            label="Email"
            icon={Mail}
            type="email"
            value={form.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="Enter email"
          />
          <Field
            id="owner-address"
            label="Address"
            icon={MapPin}
            value={form.address}
            onChange={(e) => update({ address: e.target.value })}
            placeholder="Enter address"
          />
          <div>
            <Label className="text-slate-700 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-indigo-500" />
              Notes
            </Label>
            <Textarea
              value={form.notes}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder="Add notes (optional)"
              rows={2}
              className="rounded-xl mt-1.5 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={cn('flex-1', investmentBtnSecondary)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            className={cn('flex-1', investmentBtnPrimary)}
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? 'Update Owner' : 'Create Owner'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
