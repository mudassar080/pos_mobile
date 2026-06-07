'use client';

import { Loader2, TrendingUp, Tag, DollarSign, Calendar, CreditCard } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { PAYMENT_MODES } from '@/utils/constant';
import { incomeBtnPrimary, incomeBtnSecondary } from '@/components/other-income/other-income-ui';

export const INCOME_CATEGORIES = [
  'Service',
  'Commission',
  'Old Phone Resale',
  'Accessories Repair',
  'Other',
];

export type IncomeFormData = {
  category: string;
  amount: string;
  date: string;
  paymentMode: string;
  description: string;
};

type IncomeFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: IncomeFormData;
  onFormChange: (form: IncomeFormData) => void;
  onSave: () => void;
  saving?: boolean;
};

export function IncomeFormDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSave,
  saving = false,
}: IncomeFormDialogProps) {
  const update = (patch: Partial<IncomeFormData>) => onFormChange({ ...form, ...patch });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl shadow-emerald-200/40 max-h-[90vh] overflow-y-auto',
          '[&>button]:text-white/80 [&>button]:hover:bg-white/10 [&>button]:hover:text-white'
        )}
      >
        <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 px-6 pb-6 pt-8 text-white">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">Add Other Income</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-emerald-100">
                Record additional income from services, commissions, or resale.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-white p-6">
          <div>
            <Label className="text-slate-700 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-emerald-500" />
              Category *
            </Label>
            <Select value={form.category} onValueChange={(value) => update({ category: value })}>
              <SelectTrigger className="rounded-xl mt-1.5">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {INCOME_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-700 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
              Amount *
            </Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => update({ amount: e.target.value })}
              placeholder="Enter amount"
              min="0"
              className="rounded-xl mt-1.5"
            />
          </div>

          <div>
            <Label className="text-slate-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-500" />
              Date
            </Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => update({ date: e.target.value })}
              className="rounded-xl mt-1.5"
            />
          </div>

          <div>
            <Label className="text-slate-700 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
              Payment Mode
            </Label>
            <Select
              value={form.paymentMode}
              onValueChange={(value) => update({ paymentMode: value })}
            >
              <SelectTrigger className="rounded-xl mt-1.5">
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
            <Label className="text-slate-700">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="Add description (optional)"
              rows={3}
              className="rounded-xl mt-1.5 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={cn('flex-1', incomeBtnSecondary)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            className={cn('flex-1', incomeBtnPrimary)}
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Income
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
