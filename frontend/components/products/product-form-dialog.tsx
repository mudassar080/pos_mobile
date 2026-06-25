'use client';

import { Loader2, Package, Tag, Layers, Palette } from 'lucide-react';
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
import { productBtnPrimary, productBtnSecondary } from '@/components/products/products-ui';

export type ProductFormData = {
  name: string;
  category: string;
  brand: string;
  model: string;
  color: string;
};

type ProductFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  form: ProductFormData;
  onFormChange: (form: ProductFormData) => void;
  itemNameOptions: { value: string; label: string }[];
  onSave: () => void;
  saving?: boolean;
};

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
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" />
        <Input
          id={id}
          className="rounded-xl border-slate-200 bg-slate-50/50 pl-10 focus:bg-white"
          {...inputProps}
        />
      </div>
    </div>
  );
}

export function ProductFormDialog({
  open,
  onOpenChange,
  editing,
  form,
  onFormChange,
  itemNameOptions,
  onSave,
  saving = false,
}: ProductFormDialogProps) {
  const update = (patch: Partial<ProductFormData>) => onFormChange({ ...form, ...patch });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl shadow-cyan-200/40',
          '[&>button]:text-white/80 [&>button]:hover:bg-white/10 [&>button]:hover:text-white'
        )}
      >
        <div className="bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-700 px-6 pb-6 pt-8 text-white">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                {editing ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-cyan-100">
                {editing
                  ? 'Update item name, brand, model, or color for this catalog entry.'
                  : 'Add a new item to your product catalog.'}
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
            id="product-brand"
            label="Brand"
            icon={Tag}
            value={form.brand}
            onChange={(e) => update({ brand: e.target.value })}
            placeholder="e.g., Apple, Samsung"
          />

          <Field
            id="product-model"
            label="Model"
            icon={Layers}
            value={form.model}
            onChange={(e) => update({ model: e.target.value })}
            placeholder="e.g., 15 Pro Max"
          />

          <Field
            id="product-color"
            label="Color"
            icon={Palette}
            value={form.color}
            onChange={(e) => update({ color: e.target.value })}
            placeholder="e.g., Black, Silver"
          />
        </div>

        <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={cn('flex-1', productBtnSecondary)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            className={cn('flex-1', productBtnPrimary)}
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? 'Update Product' : 'Add Product'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
