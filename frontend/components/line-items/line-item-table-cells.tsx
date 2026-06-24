'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getLineItemBrand,
  getLineItemCategory,
  getLineItemImei,
  getLineItemModel,
  getLineItemProductId,
  getLineItemProductName,
  getLineItemPurchasePrice,
  getLineItemSellingPrice,
  type LineItemLike,
} from '@/lib/line-items';
import { ProductDetailDialog } from './product-detail-dialog';
import { cn } from '@/lib/utils';

function fieldOrDash(value: string) {
  return value || '—';
}

type ProductNameCellProps = {
  item: LineItemLike;
  showViewButton?: boolean;
  className?: string;
  extra?: React.ReactNode;
};

/** Product name only (+ optional view-details action). */
export function ProductNameCell({
  item,
  showViewButton = true,
  className,
  extra,
}: ProductNameCellProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const name = getLineItemProductName(item);
  const brand = getLineItemBrand(item);
  const model = getLineItemModel(item);
  const category = getLineItemCategory(item);
  const imei = getLineItemImei(item);
  const purchasePrice = getLineItemPurchasePrice(item);
  const sellingPrice = getLineItemSellingPrice(item);
  const productId = getLineItemProductId(item);

  return (
    <>
      <div className={cn('flex items-start justify-between gap-2 min-w-[8rem]', className)}>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 leading-snug">{name}</p>
          {extra}
        </div>
        {showViewButton && (productId || brand || model) && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-lg text-indigo-600 hover:bg-indigo-50"
            onClick={() => setDialogOpen(true)}
            title="View product details"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ProductDetailDialog
        productId={productId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        fallback={{
          name,
          brand,
          model,
          category,
          imei,
          purchasePrice,
          sellingPrice,
          color: typeof item.product === 'object' ? item.product?.color : undefined,
          status: typeof item.product === 'object' ? item.product?.status : undefined,
          quantity: typeof item.product === 'object' ? item.product?.quantity : undefined,
        }}
      />
    </>
  );
}

export function LineItemBrandCell({
  item,
  className,
}: {
  item: LineItemLike;
  className?: string;
}) {
  return (
    <span className={cn('text-sm text-slate-700', className)}>
      {fieldOrDash(getLineItemBrand(item))}
    </span>
  );
}

export function LineItemModelCell({
  item,
  className,
}: {
  item: LineItemLike;
  className?: string;
}) {
  return (
    <span className={cn('text-sm text-slate-700', className)}>
      {fieldOrDash(getLineItemModel(item))}
    </span>
  );
}

export function LineItemCategoryCell({
  item,
  className,
}: {
  item: LineItemLike;
  className?: string;
}) {
  return (
    <span className={cn('text-sm text-slate-600', className)}>
      {fieldOrDash(getLineItemCategory(item))}
    </span>
  );
}

export function LineItemImeiCell({
  item,
  className,
}: {
  item: LineItemLike;
  className?: string;
}) {
  const imei = getLineItemImei(item);
  return (
    <span className={cn('text-sm font-mono text-indigo-600', className)}>
      {imei || '—'}
    </span>
  );
}
