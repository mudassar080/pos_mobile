'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { productsApi } from '@/lib/api';
import { formatCurrency } from '@/utils/constant';

type ProductDetailDialogProps = {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fallback?: {
    name?: string;
    brand?: string;
    model?: string;
    category?: string;
    imei?: string | null;
    purchasePrice?: number;
    sellingPrice?: number;
    color?: string | null;
    status?: string;
    quantity?: number;
  };
};

export function ProductDetailDialog({
  productId,
  open,
  onOpenChange,
  fallback,
}: ProductDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);

  const [fallbackProduct, setFallbackProduct] = useState(fallback);

  useEffect(() => {
    if (open) setFallbackProduct(fallback);
  }, [open, fallback]);

  useEffect(() => {
    if (!open) {
      setProduct(null);
      return;
    }

    if (!productId) {
      setProduct(fallbackProduct || null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const response = await productsApi.getById(productId);
        if (!cancelled && response.success && response.data) {
          setProduct(response.data);
        } else if (!cancelled) {
          setProduct(fallbackProduct || null);
        }
      } catch {
        if (!cancelled) setProduct(fallbackProduct || null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [open, productId, fallbackProduct]);

  const data = product || fallbackProduct;
  const title = data?.name || 'Product Details';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : !data ? (
          <p className="py-6 text-center text-sm text-slate-500">Product details unavailable</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Brand', value: data.brand },
              { label: 'Model', value: data.model },
              { label: 'Category', value: data.category },
              { label: 'IMEI', value: data.imei, mono: true },
              { label: 'Color', value: data.color },
              { label: 'Status', value: data.status },
              {
                label: 'Purchase Price',
                value:
                  data.purchasePrice != null ? formatCurrency(data.purchasePrice) : undefined,
              },
              {
                label: 'Sale Price',
                value:
                  data.sellingPrice != null ? formatCurrency(data.sellingPrice) : undefined,
              },
              {
                label: 'Stock Qty',
                value: data.quantity != null ? String(data.quantity) : undefined,
              },
            ]
              .filter((field) => field.value)
              .map((field) => (
                <div key={field.label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{field.label}</p>
                  <p className={`mt-0.5 font-semibold text-slate-900 ${field.mono ? 'font-mono text-xs' : ''}`}>
                    {field.value}
                  </p>
                </div>
              ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
