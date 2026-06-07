import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export {
  ColorCard,
  SummaryStat,
  SalesPageHero,
  formatAccountingDate,
} from '@/components/accounting/accounting-ui';

export const INCOME_GRADIENT = 'from-emerald-600 via-green-600 to-teal-700';

export const incomeBtnPrimary =
  'rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 border-0 shadow-lg shadow-emerald-300/30';

export const incomeBtnSecondary =
  'rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50';

export function NewIncomeButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="lg"
      onClick={onClick}
      className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-300/40 border-0 w-full sm:w-auto"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add Income
    </Button>
  );
}

export function getIncomeCategoryBadge(category: string) {
  const styles: Record<string, string> = {
    Service: 'bg-gradient-to-r from-blue-500 to-indigo-600 border-0',
    Commission: 'bg-gradient-to-r from-violet-500 to-purple-600 border-0',
    'Old Phone Resale': 'bg-gradient-to-r from-amber-500 to-orange-500 border-0',
    'Accessories Repair': 'bg-gradient-to-r from-cyan-500 to-teal-600 border-0',
    Other: 'bg-gradient-to-r from-slate-500 to-slate-600 border-0',
  };
  return styles[category] || 'bg-gradient-to-r from-emerald-500 to-green-600 border-0';
}
