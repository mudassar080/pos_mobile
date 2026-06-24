export type LineItemLike = {
  productName?: string;
  product?: {
    _id?: string;
    name?: string;
    brand?: string;
    model?: string;
    category?: string;
    imei?: string | null;
    purchasePrice?: number;
    sellingPrice?: number;
    lastPurchasePrice?: number;
    color?: string | null;
    status?: string;
    quantity?: number;
  } | string;
  name?: string;
  brand?: string;
  model?: string;
  category?: string;
  imei?: string | null;
  purchasePrice?: number;
  sellingPrice?: number;
  price?: number;
};

function getProductObject(item: LineItemLike | null | undefined) {
  if (!item || typeof item.product !== 'object' || !item.product) return null;
  return item.product;
}

export function getLineItemProductId(item: LineItemLike | null | undefined): string | null {
  if (!item) return null;
  if (typeof item.product === 'string') return item.product;
  if (typeof item.product === 'object' && item.product._id) return item.product._id;
  return null;
}

export function getLineItemProductName(item: LineItemLike | null | undefined): string {
  if (!item) return '—';

  if (item.productName?.trim()) {
    return item.productName.trim();
  }

  const product = getProductObject(item);
  if (product?.name?.trim()) {
    return product.name.trim();
  }

  if (item.name?.trim()) {
    return item.name.trim();
  }

  return '—';
}

export function getLineItemBrand(item: LineItemLike | null | undefined): string {
  if (!item) return '';
  return (item.brand || getProductObject(item)?.brand || '').trim();
}

export function getLineItemModel(item: LineItemLike | null | undefined): string {
  if (!item) return '';
  return (item.model || getProductObject(item)?.model || '').trim();
}

export function getLineItemCategory(item: LineItemLike | null | undefined): string {
  if (!item) return '';
  return (item.category || getProductObject(item)?.category || '').trim();
}

export function getLineItemImei(item: LineItemLike | null | undefined): string {
  if (!item) return '';
  const imei = item.imei ?? getProductObject(item)?.imei;
  return imei ? String(imei).trim() : '';
}

export function getLineItemPurchasePrice(item: LineItemLike | null | undefined): number | undefined {
  if (!item) return undefined;
  const fromProduct = getProductObject(item);
  const value =
    item.purchasePrice ??
    fromProduct?.lastPurchasePrice ??
    fromProduct?.purchasePrice;
  return value != null ? Number(value) : undefined;
}

export function getLineItemSellingPrice(item: LineItemLike | null | undefined): number | undefined {
  if (!item) return undefined;
  const fromProduct = getProductObject(item);
  const value = item.sellingPrice ?? fromProduct?.sellingPrice ?? item.price;
  return value != null ? Number(value) : undefined;
}

export function formatLineItemNames(items: unknown[] | undefined): string {
  if (!items?.length) return '—';
  return items
    .map((item) => getLineItemProductName(item as LineItemLike))
    .join(', ');
}

export function formatProductSearchLabel(
  item: LineItemLike,
  formatCurrency: (value: number) => string
): string {
  const parts = [getLineItemProductName(item)];
  const brand = getLineItemBrand(item);
  const model = getLineItemModel(item);
  const sale = getLineItemSellingPrice(item);
  const purchase = getLineItemPurchasePrice(item);

  if (brand) parts.push(`Brand: ${brand}`);
  if (model) parts.push(`Model: ${model}`);
  if (sale != null && sale > 0) parts.push(`Sale: ${formatCurrency(sale)}`);
  if (purchase != null && purchase > 0) parts.push(`Purchase: ${formatCurrency(purchase)}`);

  return parts.join(' | ');
}

export function normalizeSaleLineItem(item: any) {
  const product = typeof item?.product === 'object' ? item.product : null;

  return {
    product: product?._id || item?.product,
    productName: getLineItemProductName(item),
    brand: getLineItemBrand(item),
    model: getLineItemModel(item),
    category: getLineItemCategory(item),
    imei: getLineItemImei(item) || null,
    purchasePrice: getLineItemPurchasePrice(item) ?? 0,
    sellingPrice: getLineItemSellingPrice(item),
    productData: product,
  };
}
