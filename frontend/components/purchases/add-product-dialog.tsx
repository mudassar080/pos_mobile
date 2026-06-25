'use client';

import { Layers, Loader2, Package, Tag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import { purchaseBtnPrimary, purchaseBtnSecondary } from '@/components/purchases/purchases-ui';

export type PurchaseProductFormData = {
  name: string;
  brand: string;
  model: string;
};

type AddProductDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: PurchaseProductFormData;
  onFormChange: (form: PurchaseProductFormData) => void;
  itemNameOptions: { value: string; label: string }[];
  onSave: () => void;
  saving?: boolean;
};

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

function buildCategoryPreview(name: string, brand: string, model: string) {
  const parts = [
    name ? toTitleCase(name) : '',
    brand ? toTitleCase(brand) : '',
    model ? toTitleCase(model) : '',
  ].filter(Boolean);
  return parts.join(' - ') || '—';
}

function Field({
  id,
  label,
  icon: Icon,
  ...inputProps
}: {
  id: string;
  label: string;
  icon: typeof Tag;
} & React.ComponentProps<typeof Input>) {
  return (
    <div>
      <Label htmlFor={id} className="text-slate-700">
        {label}
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

export function AddProductDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  itemNameOptions,
  onSave,
  saving = false,
}: AddProductDialogProps) {
  const update = (patch: Partial<PurchaseProductFormData>) =>
    onFormChange({ ...form, ...patch });

  const categoryPreview = buildCategoryPreview(form.name, form.brand, form.model);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl shadow-indigo-200/40',
          '[&>button]:text-white/80 [&>button]:hover:bg-white/10 [&>button]:hover:text-white'
        )}
      >
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-6 pb-6 pt-8 text-white">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                Add New Product
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-indigo-100">
                Add a product to this purchase. It will be saved to inventory when you complete
                the purchase.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-white p-6">
          <div>
            <Label className="text-slate-700">Item Name *</Label>
            <div className="mt-1.5">
              <Combobox
                options={itemNameOptions}
                value={form.name}
                onValueChange={(value) => update({ name: value })}
                placeholder="Search or create item name"
                searchPlaceholder="Search items..."
                emptyText="No items found"
                allowCreate
                onCreateNew={(newName) => update({ name: newName })}
              />
            </div>
          </div>

          <Field
            id="purchase-product-brand"
            label="Brand"
            icon={Tag}
            value={form.brand}
            onChange={(e) => update({ brand: e.target.value })}
            placeholder="e.g., Apple, Samsung"
          />

          <Field
            id="purchase-product-model"
            label="Model"
            icon={Layers}
            value={form.model}
            onChange={(e) => update({ model: e.target.value })}
            placeholder="e.g., 15 Pro Max"
          />

          <div>
            <Label htmlFor="purchase-product-category" className="text-slate-700">
              Category
            </Label>
            <Input
              id="purchase-product-category"
              value={categoryPreview}
              readOnly
              className="mt-1.5 rounded-xl border-indigo-100 bg-indigo-50/50 text-slate-700"
            />
            <p className="mt-1 text-xs text-slate-500">
              Auto-generated from item name, brand, and model
            </p>
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={cn('flex-1', purchaseBtnSecondary)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            className={cn('flex-1', purchaseBtnPrimary)}
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Product
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
