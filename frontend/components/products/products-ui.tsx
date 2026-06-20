import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export {
  ColorCard,
  SummaryStat,
  SummaryStatGrid,
  STAT_GRID_CLASS,
  SalesPageHero,
} from '@/components/sales/sales-ui';

export const PRODUCT_GRADIENT = 'from-sky-600 via-cyan-600 to-teal-700';

export const productBtnPrimary =
  'rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 border-0 shadow-lg shadow-cyan-300/30';

export const productBtnSecondary =
  'rounded-xl border-cyan-200 text-cyan-700 hover:bg-cyan-50';

export function NewProductButton({ onClick }: { onClick?: () => void }) {
  if (onClick) {
    return (
      <Button
        size="lg"
        onClick={onClick}
        className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 shadow-lg shadow-cyan-300/40 border-0 w-full sm:w-auto"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Product
      </Button>
    );
  }

  return (
    <Link href="/products">
      <Button
        size="lg"
        className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 shadow-lg shadow-cyan-300/40 border-0 w-full sm:w-auto"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Product
      </Button>
    </Link>
  );
}
