import { Button } from '@/components/ui/button';
import { Plus, UserPlus } from 'lucide-react';

export {
  ColorCard,
  SummaryStat,
  SummaryStatGrid,
  STAT_GRID_CLASS,
  SalesPageHero,
  formatAccountingDate,
} from '@/components/accounting/accounting-ui';

export const INVESTMENT_GRADIENT = 'from-violet-600 via-indigo-600 to-purple-700';

export const investmentBtnPrimary =
  'rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-0 shadow-lg shadow-indigo-300/30';

export const investmentBtnSecondary =
  'rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50';

export function NewTransactionButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="lg"
      onClick={onClick}
      className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-lg shadow-indigo-300/40 border-0 w-full sm:w-auto"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add Transaction
    </Button>
  );
}

export function AddOwnerButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="lg"
      variant="outline"
      onClick={onClick}
      className="rounded-xl bg-white/15 text-white border-white/25 hover:bg-white/25 hover:text-white w-full sm:w-auto"
    >
      <UserPlus className="w-4 h-4 mr-2" />
      Add Owner
    </Button>
  );
}

export function getTransactionTypeBadge(type: string) {
  if (type === 'investment') {
    return 'bg-gradient-to-r from-emerald-500 to-green-600 border-0 capitalize';
  }
  return 'bg-gradient-to-r from-rose-500 to-red-600 border-0 capitalize';
}
