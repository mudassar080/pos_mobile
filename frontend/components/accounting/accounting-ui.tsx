import { Badge } from '@/components/ui/badge';

export {
  ColorCard,
  SummaryStat,
  SalesPageHero,
  formatSaleDateShort,
} from '@/components/sales/sales-ui';

export const RECEIVABLE_GRADIENT = 'from-amber-600 via-orange-600 to-red-600';
export const PAYABLE_GRADIENT = 'from-red-600 via-rose-600 to-pink-700';

export function getAgingBadge(aging: string) {
  if (aging === '0-30 days') {
    return (
      <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 border-0">{aging}</Badge>
    );
  }
  if (aging === '30-60 days') {
    return (
      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 border-0">{aging}</Badge>
    );
  }
  return <Badge className="bg-gradient-to-r from-rose-500 to-red-600 border-0">{aging}</Badge>;
}

export function formatAccountingDate(date: string) {
  return new Date(date).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
