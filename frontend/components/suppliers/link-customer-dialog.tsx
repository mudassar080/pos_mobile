'use client';

import { Loader2, Link2, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/constant';

const linkBtnPrimary =
  'rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-0 shadow-lg shadow-violet-300/30';

const supplierBtnSecondary =
  'rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50';

type LinkCustomerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierName: string;
  customerId: string;
  onCustomerChange: (value: string) => void;
  customers: any[];
  onSave: () => void;
  saving?: boolean;
};

export function LinkCustomerDialog({
  open,
  onOpenChange,
  supplierName,
  customerId,
  onCustomerChange,
  customers,
  onSave,
  saving = false,
}: LinkCustomerDialogProps) {
  const removing = customerId === '__none__';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl shadow-violet-200/40',
          '[&>button]:text-white/80 [&>button]:hover:bg-white/10 [&>button]:hover:text-white'
        )}
      >
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 px-6 pb-6 pt-8 text-white">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                Link to Customer
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-violet-100">
                Connect a supplier who is also a customer to track net balance.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-white p-6">
          <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-indigo-50/50 p-3 text-sm text-violet-800">
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 shrink-0 mt-0.5 text-violet-600" />
              <p>
                If this supplier is also your customer, link them to auto-track net balance.
                Payable and receivable will show as a single net amount and can be settled
                together.
              </p>
            </div>
          </div>
          <div>
            <Label className="text-slate-700">Supplier</Label>
            <Input
              value={supplierName}
              disabled
              className="rounded-xl mt-1.5 bg-slate-50"
            />
          </div>
          <div>
            <Label className="text-slate-700">Link to Customer</Label>
            <Select value={customerId} onValueChange={onCustomerChange}>
              <SelectTrigger className="rounded-xl mt-1.5">
                <SelectValue placeholder="Select a customer..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">-- No Link (Remove) --</SelectItem>
                {customers.map((c: any) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name} ({c.phone})
                    {c.outstanding > 0 ? ` - Receivable: ${formatCurrency(c.outstanding)}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            className={cn('flex-1', linkBtnPrimary)}
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {removing ? 'Remove Link' : 'Link Customer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
