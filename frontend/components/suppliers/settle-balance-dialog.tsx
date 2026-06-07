'use client';

import { ArrowLeftRight, Loader2 } from 'lucide-react';
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
import { formatCurrency } from '@/utils/constant';

type SettleBalanceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: any | null;
  onSettle: () => void;
  saving?: boolean;
};

export function SettleBalanceDialog({
  open,
  onOpenChange,
  supplier,
  onSettle,
  saving = false,
}: SettleBalanceDialogProps) {
  const pay = supplier?.outstanding || 0;
  const recv = supplier?.linkedCustomer?.outstanding || 0;
  const isNegativePayable = pay < 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-orange-900">
            <ArrowLeftRight className="h-5 w-5 text-orange-600" />
            Settle Linked Balance
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-slate-600">
              {supplier &&
                (isNegativePayable ? (
                  <>
                    <p>
                      Supplier has a <strong>credit balance</strong> (they owe you). This will
                      transfer that amount as receivable to the linked customer account.
                    </p>
                    <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-orange-50/50 ring-1 ring-orange-100 p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Supplier credit (they owe you):</span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(Math.abs(pay))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current customer receivable:</span>
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(recv)}
                        </span>
                      </div>
                      <hr className="border-orange-100" />
                      <div className="flex justify-between font-semibold">
                        <span>Transfer to receivable:</span>
                        <span className="text-orange-600">
                          {formatCurrency(Math.abs(pay))}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>After settlement:</span>
                        <span>
                          Supplier payable: {formatCurrency(0)} | Customer receivable:{' '}
                          {formatCurrency(recv + Math.abs(pay))}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p>
                      This will net off the payable (what you owe the supplier) against the
                      receivable (what the customer owes you).
                    </p>
                    <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-orange-50/50 ring-1 ring-orange-100 p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Payable (you owe supplier):</span>
                        <span className="font-semibold text-rose-600">{formatCurrency(pay)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Receivable (customer owes you):</span>
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(recv)}
                        </span>
                      </div>
                      <hr className="border-orange-100" />
                      <div className="flex justify-between font-semibold">
                        <span>Settlement amount:</span>
                        <span className="text-orange-600">
                          {formatCurrency(Math.min(pay, recv))}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>After settlement:</span>
                        <span>
                          Payable: {formatCurrency(Math.max(0, pay - recv))} | Receivable:{' '}
                          {formatCurrency(Math.max(0, recv - pay))}
                        </span>
                      </div>
                    </div>
                  </>
                ))}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving} className="rounded-xl">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onSettle}
            disabled={saving}
            className="rounded-xl bg-orange-600 hover:bg-orange-700"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Settle Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
