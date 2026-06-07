'use client';

import { Loader2, TrendingUp, User, DollarSign, Calendar, Tag } from 'lucide-react';
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
import { investmentBtnPrimary, investmentBtnSecondary } from '@/components/investments/investments-ui';

export type TransactionFormData = {
  owner: string;
  type: string;
  amount: string;
  date: string;
  description: string;
};

type TransactionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: TransactionFormData;
  onFormChange: (form: TransactionFormData) => void;
  owners: any[];
  onSave: () => void;
  saving?: boolean;
};

export function TransactionFormDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  owners,
  onSave,
  saving = false,
}: TransactionFormDialogProps) {
  const update = (patch: Partial<TransactionFormData>) => onFormChange({ ...form, ...patch });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl shadow-violet-200/40 max-h-[90vh] overflow-y-auto',
          '[&>button]:text-white/80 [&>button]:hover:bg-white/10 [&>button]:hover:text-white'
        )}
      >
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 pb-6 pt-8 text-white">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                Add Investment / Withdrawal
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-violet-100">
                Record capital invested or withdrawn by an owner.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-white p-6">
          <div>
            <Label className="text-slate-700 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-violet-500" />
              Owner *
            </Label>
            <Select value={form.owner} onValueChange={(value) => update({ owner: value })}>
              <SelectTrigger className="rounded-xl mt-1.5">
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
              <p className="text-xs text-rose-500 mt-1.5">
                No owners found. Please add an owner first.
              </p>
            )}
          </div>

          <div>
            <Label className="text-slate-700 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-violet-500" />
              Type *
            </Label>
            <Select value={form.type} onValueChange={(value) => update({ type: value })}>
              <SelectTrigger className="rounded-xl mt-1.5">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-700 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-violet-500" />
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
              <Calendar className="h-3.5 w-3.5 text-violet-500" />
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
            className={cn('flex-1', investmentBtnSecondary)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            className={cn('flex-1', investmentBtnPrimary)}
            disabled={saving || owners.length === 0}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Transaction
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
