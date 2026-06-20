import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookOpen, Download, FileBarChart } from 'lucide-react';

export {
  ColorCard,
  SummaryStat,
  SummaryStatGrid,
  STAT_GRID_CLASS,
  SalesPageHero,
} from '@/components/accounting/accounting-ui';

export const REPORT_GRADIENT = 'from-slate-600 via-zinc-600 to-gray-700';

export const reportBtnPrimary =
  'rounded-xl bg-gradient-to-r from-slate-600 to-zinc-700 hover:from-slate-700 hover:to-zinc-800 border-0 shadow-lg shadow-slate-300/30';

export const reportBtnSecondary =
  'rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50';

export function ViewToggle({
  view,
  onViewChange,
}: {
  view: 'report' | 'daybook';
  onViewChange: (view: 'report' | 'daybook') => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="lg"
        variant="outline"
        onClick={() => onViewChange('report')}
        className={cn(
          'rounded-xl w-full sm:w-auto border-0',
          view === 'report'
            ? 'bg-white text-slate-800 hover:bg-white/90 shadow-lg'
            : 'bg-white/15 text-white border-white/25 hover:bg-white/25 hover:text-white'
        )}
      >
        <FileBarChart className="w-4 h-4 mr-2" />
        Reports
      </Button>
      <Button
        size="lg"
        variant="outline"
        onClick={() => onViewChange('daybook')}
        className={cn(
          'rounded-xl w-full sm:w-auto border-0',
          view === 'daybook'
            ? 'bg-white text-slate-800 hover:bg-white/90 shadow-lg'
            : 'bg-white/15 text-white border-white/25 hover:bg-white/25 hover:text-white'
        )}
      >
        <BookOpen className="w-4 h-4 mr-2" />
        Day Book
      </Button>
    </div>
  );
}

export function ExportCsvButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
    >
      <Download className="w-4 h-4 mr-2" />
      Export CSV
    </Button>
  );
}

export function getDayBookTypeBadge(type: string) {
  const styles: Record<string, string> = {
    Sale: 'bg-gradient-to-r from-emerald-500 to-green-600 border-0',
    Purchase: 'bg-gradient-to-r from-blue-500 to-indigo-600 border-0',
    Expense: 'bg-gradient-to-r from-rose-500 to-red-600 border-0',
    'Other Income': 'bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-amber-950',
  };
  return styles[type] || 'bg-gradient-to-r from-slate-500 to-slate-600 border-0';
}

export function DayBookTypeBadge({ type }: { type: string }) {
  return <Badge className={getDayBookTypeBadge(type)}>{type}</Badge>;
}
