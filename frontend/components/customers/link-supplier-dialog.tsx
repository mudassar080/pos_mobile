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

const customerBtnPrimary =
  'rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 border-0 shadow-lg shadow-violet-300/30';

const customerBtnSecondary =
  'rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50';

type LinkSupplierDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  supplierId: string;
  onSupplierChange: (value: string) => void;
  suppliers: any[];
  onSave: () => void;
  saving?: boolean;
};

export function LinkSupplierDialog({
  open,
  onOpenChange,
  customerName,
  supplierId,
  onSupplierChange,
  suppliers,
  onSave,
  saving = false,
}: LinkSupplierDialogProps) {
  const removing = supplierId === '__none__';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl shadow-violet-200/40',
          '[&>button]:text-white/80 [&>button]:hover:bg-white/10 [&>button]:hover:text-white'
        )}
      >
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 px-6 pb-6 pt-8 text-white">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
                Link to Supplier
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-violet-100">
                Connect a customer who is also a supplier to track net balance.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-white p-6">
          <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-purple-50/50 p-3 text-sm text-violet-800">
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 shrink-0 mt-0.5 text-violet-600" />
              <p>
                If this customer is also your supplier, link them to auto-track net balance.
                Receivable and payable will show as a single net amount.
              </p>
            </div>
          </div>
          <div>
            <Label className="text-slate-700">Customer</Label>
            <Input
              value={customerName}
              disabled
              className="rounded-xl mt-1.5 bg-slate-50"
            />
          </div>
          <div>
            <Label className="text-slate-700">Link to Supplier</Label>
            <Select value={supplierId} onValueChange={onSupplierChange}>
              <SelectTrigger className="rounded-xl mt-1.5">
                <SelectValue placeholder="Select a supplier..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">-- No Link (Remove) --</SelectItem>
                {suppliers.map((s: any) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name} ({s.phone})
                    {s.outstanding > 0 ? ` - Payable: ${formatCurrency(s.outstanding)}` : ''}
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
            {removing ? 'Remove Link' : 'Link Supplier'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
