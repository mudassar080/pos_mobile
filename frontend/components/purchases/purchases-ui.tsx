import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export {
  ColorCard,
  SummaryStat,
  SalesPageHero,
  getStatusBadge,
  getReasonBadge,
  formatSaleDate,
  formatSaleDateShort,
} from '@/components/sales/sales-ui';

export const PURCHASE_GRADIENT = 'from-blue-600 via-indigo-600 to-violet-700';
export const PURCHASE_RETURN_GRADIENT = 'from-violet-600 via-purple-600 to-fuchsia-700';

export function NewPurchaseButton() {
  return (
    <Link href="/purchases/new">
      <Button
        size="lg"
        className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-300/40 border-0 w-full sm:w-auto"
      >
        <Plus className="w-4 h-4 mr-2" />
        New Purchase
      </Button>
    </Link>
  );
}

export const purchaseBtnPrimary =
  'rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-lg shadow-blue-300/30';

export const purchaseBtnSecondary =
  'rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50';

export { AddSupplierDialog, type SupplierFormData } from '@/components/purchases/add-supplier-dialog';

export function NewPurchaseReturnButton() {
  return (
    <Link href="/purchases/returns/new">
      <Button
        size="lg"
        className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 shadow-lg shadow-violet-300/40 border-0 w-full sm:w-auto"
      >
        <Plus className="w-4 h-4 mr-2" />
        New Return
      </Button>
    </Link>
  );
}
