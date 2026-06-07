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

type AgingPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: 'receive' | 'pay';
  partyLabel: string;
  partyName: string;
  referenceLabel: string;
  referenceValue: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  amount: string;
  onAmountChange: (value: string) => void;
  onSave: () => void;
  saving?: boolean;
};

export function AgingPaymentDialog({
  open,
  onOpenChange,
  variant,
  partyLabel,
  partyName,
  referenceLabel,
  referenceValue,
  totalAmount,
  paidAmount,
  dueAmount,
  amount,
  onAmountChange,
  onSave,
  saving = false,
}: AgingPaymentDialogProps) {
  const isReceive = variant === 'receive';
  const headerGradient = isReceive
    ? 'from-emerald-600 via-teal-600 to-cyan-700'
    : 'from-rose-600 via-red-600 to-pink-700';
  const primaryBtn = isReceive
    ? 'rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-0 shadow-lg shadow-emerald-300/30'
    : 'rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 border-0 shadow-lg shadow-rose-300/30';
  const secondaryBtn = isReceive
    ? 'rounded-xl border-orange-200 text-orange-700 hover:bg-orange-50'
    : 'rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50';
  const dueClass = isReceive ? 'text-orange-700' : 'text-rose-700';
  const dueBg = isReceive ? 'bg-orange-50 border-orange-100' : 'bg-rose-50 border-rose-100';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl',
          isReceive ? 'shadow-emerald-200/40' : 'shadow-rose-200/40',
          '[&>button]:text-white/80 [&>button]:hover:bg-white/10 [&>button]:hover:text-white'
        )}
      >
        <div className={cn('bg-gradient-to-br px-6 pb-6 pt-8 text-white', headerGradient)}>
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                {isReceive ? 'Receive Payment' : 'Make Payment'}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-white/80">
                {isReceive
                  ? 'Record a payment against this outstanding invoice.'
                  : 'Record a payment against this outstanding purchase.'}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-white p-6">
          <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 ring-1 ring-slate-200/60 p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">{partyLabel}</span>
              <span className="font-semibold text-slate-900 text-right">{partyName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">{referenceLabel}</span>
              <span className="font-medium text-right">{referenceValue}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Total Amount</span>
              <span className="font-medium">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Already Paid</span>
              <span className="font-medium text-emerald-600">{formatCurrency(paidAmount)}</span>
            </div>
            <div className={cn('flex justify-between gap-4 rounded-xl border px-3 py-2 mt-1', dueBg)}>
              <span className="font-medium text-slate-600">Outstanding</span>
              <span className={cn('font-bold', dueClass)}>{formatCurrency(dueAmount)}</span>
            </div>
          </div>

          <div>
            <Label className="text-slate-700">Payment Amount (PKR) *</Label>
            <Input
              type="number"
              min="1"
              max={dueAmount}
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="Enter amount"
              className="rounded-xl mt-1.5"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Maximum: {formatCurrency(dueAmount)}
            </p>
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={cn('flex-1', secondaryBtn)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            className={cn('flex-1', primaryBtn)}
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isReceive ? 'Receive Payment' : 'Make Payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
