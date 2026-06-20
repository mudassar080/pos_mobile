import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export {
  ColorCard,
  SummaryStat,
  SummaryStatGrid,
  STAT_GRID_CLASS,
  SalesPageHero,
} from '@/components/sales/sales-ui';

export const SUPPLIER_GRADIENT = 'from-fuchsia-600 via-purple-600 to-violet-700';

export const supplierBtnPrimary =
  'rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 border-0 shadow-lg shadow-purple-300/30';

export const supplierBtnSecondary =
  'rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50';

export function NewSupplierButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="lg"
      onClick={onClick}
      className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 shadow-lg shadow-purple-300/40 border-0 w-full sm:w-auto"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add Supplier
    </Button>
  );
}
