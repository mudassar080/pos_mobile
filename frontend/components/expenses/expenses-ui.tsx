import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export {
  ColorCard,
  SummaryStat,
  SalesPageHero,
  formatAccountingDate,
} from '@/components/accounting/accounting-ui';

export const EXPENSE_GRADIENT = 'from-rose-600 via-red-600 to-orange-700';

export const expenseBtnPrimary =
  'rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 border-0 shadow-lg shadow-rose-300/30';

export const expenseBtnSecondary =
  'rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50';

export function NewExpenseButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="lg"
      onClick={onClick}
      className="rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-lg shadow-rose-300/40 border-0 w-full sm:w-auto"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add Expense
    </Button>
  );
}

export function getCategoryBadge(category: string) {
  const styles: Record<string, string> = {
    Rent: 'bg-gradient-to-r from-violet-500 to-purple-600 border-0',
    Salary: 'bg-gradient-to-r from-blue-500 to-indigo-600 border-0',
    Electricity: 'bg-gradient-to-r from-amber-500 to-yellow-500 border-0 text-amber-950',
    Repair: 'bg-gradient-to-r from-orange-500 to-red-500 border-0',
    Marketing: 'bg-gradient-to-r from-pink-500 to-rose-600 border-0',
    Transport: 'bg-gradient-to-r from-cyan-500 to-teal-600 border-0',
    Other: 'bg-gradient-to-r from-slate-500 to-slate-600 border-0',
  };
  return styles[category] || styles.Other;
}
