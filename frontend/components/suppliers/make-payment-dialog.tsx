'use client';

import { Loader2, DollarSign } from 'lucide-react';
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
import { formatCurrency } from '@/utils/constant';

const payBtnPrimary =
  'rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-0 shadow-lg shadow-emerald-300/30';

const supplierBtnSecondary =
  'rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50';

type MakePaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierName: string;
  outstanding: number;
  amount: string;
  onAmountChange: (value: string) => void;
  onSave: () => void;
  saving?: boolean;
};

export function MakePaymentDialog({
  open,
  onOpenChange,
  supplierName,
  outstanding,
  amount,
  onAmountChange,
  onSave,
  saving = false,
}: MakePaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl shadow-emerald-200/40',
          '[&>button]:text-white/80 [&>button]:hover:bg-white/10 [&>button]:hover:text-white'
        )}
      >
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-6 pb-6 pt-8 text-white">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">Make Payment</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-emerald-100">
                Record a payment against supplier payable.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-white p-6">
          <div>
            <Label className="text-slate-700">Supplier</Label>
            <Input
              value={supplierName}
              disabled
              className="rounded-xl mt-1.5 bg-slate-50"
            />
          </div>
          <div>
            <Label className="text-slate-700">Outstanding Amount</Label>
            <Input
              value={formatCurrency(outstanding)}
              disabled
              className="rounded-xl mt-1.5 bg-rose-50 text-rose-700 font-semibold border-rose-100"
            />
          </div>
          <div>
            <Label className="text-slate-700">Payment Amount *</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="Enter amount"
              min="0"
              className="rounded-xl mt-1.5"
            />
          </div>
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
            className={cn('flex-1', payBtnPrimary)}
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Make Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
