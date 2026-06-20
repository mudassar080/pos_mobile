import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export {
  ColorCard,
  SummaryStat,
  SummaryStatGrid,
  STAT_GRID_CLASS,
  SalesPageHero,
} from '@/components/sales/sales-ui';

export const CUSTOMER_GRADIENT = 'from-pink-600 via-rose-600 to-red-700';

export const customerBtnPrimary =
  'rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 border-0 shadow-lg shadow-rose-300/30';

export const customerBtnSecondary =
  'rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50';

export function NewCustomerButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="lg"
      onClick={onClick}
      className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-rose-300/40 border-0 w-full sm:w-auto"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add Customer
    </Button>
  );
}
