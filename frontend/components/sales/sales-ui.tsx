import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowLeft, Eye, Pencil, Plus, type LucideIcon } from 'lucide-react';

export function formatSaleDate(date: string) {
  return new Date(date).toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatSaleDateShort(date: string) {
  return new Date(date).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return (
        <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-500 hover:to-green-600 border-0">
          Paid
        </Badge>
      );
    case 'partial':
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-500 border-0">
          Partial
        </Badge>
      );
    case 'credit':
      return (
        <Badge className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-500 hover:to-red-600 border-0">
          Credit
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-500 hover:to-slate-600 border-0">
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

type PageHeroProps = {
  title: string;
  description: string;
  gradient?: string;
  badge?: string;
  backHref?: string;
  actions?: React.ReactNode;
};

export function SalesPageHero({
  title,
  description,
  gradient = 'from-cyan-600 via-blue-600 to-indigo-700',
  badge,
  backHref,
  actions,
}: PageHeroProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl bg-gradient-to-br p-5 sm:p-8 text-white shadow-xl',
        gradient,
        gradient.includes('cyan') && 'shadow-cyan-300/30',
        gradient.includes('violet') && 'shadow-violet-300/30',
        gradient.includes('indigo') && 'shadow-indigo-300/30'
      )}
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2 min-w-0">
          {backHref && (
            <Link href={backHref}>
              <Button
                variant="secondary"
                size="sm"
                className="mb-1 rounded-xl bg-white/15 text-white hover:bg-white/25 border-0"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Button>
            </Link>
          )}
          {badge && (
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm ring-1 ring-white/20">
              {badge}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{title}</h1>
          <p className="text-sm sm:text-base text-white/80">{description}</p>
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

type SummaryStatProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  theme: string;
};

export function SummaryStat({ label, value, icon: Icon, theme }: SummaryStatProps) {
  return (
    <div className={cn('rounded-2xl p-4 sm:p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg', theme)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight truncate">{value}</p>
        </div>
        <div className="rounded-xl bg-white/20 p-2.5 shrink-0">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  );
}

export function NewSaleButton() {
  return (
    <Link href="/sales/new">
      <Button
        size="lg"
        className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-300/40 border-0 w-full sm:w-auto"
      >
        <Plus className="w-4 h-4 mr-2" />
        New Sale
      </Button>
    </Link>
  );
}

export function SaleActionLinks({
  saleId,
  status,
  size = 'sm',
  allowEdit = true,
}: {
  saleId: string;
  status: string;
  size?: 'sm' | 'icon';
  allowEdit?: boolean;
}) {
  const canEdit = allowEdit && status !== 'cancelled' && status !== 'paid';

  return (
    <div className="flex items-center gap-1">
      <Link href={`/sales/${saleId}`}>
        <Button
          variant="ghost"
          size={size === 'icon' ? 'icon' : 'sm'}
          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg"
        >
          <Eye className="h-4 w-4" />
          {size !== 'icon' && <span className="ml-1">View</span>}
        </Button>
      </Link>
      {canEdit && (
        <Link href={`/sales/${saleId}/edit`}>
          <Button
            variant="ghost"
            size={size === 'icon' ? 'icon' : 'sm'}
            className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg"
          >
            <Pencil className="h-4 w-4" />
            {size !== 'icon' && <span className="ml-1">Edit</span>}
          </Button>
        </Link>
      )}
    </div>
  );
}

export function ColorCard({
  title,
  children,
  headerClassName,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  headerClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn('border-0 rounded-2xl shadow-lg overflow-hidden bg-white ring-1 ring-slate-200/60', className)}>
      {title && (
        <div className={cn('px-4 sm:px-6 py-4 border-b', headerClassName)}>
          <h3 className="font-semibold text-base sm:text-lg">{title}</h3>
        </div>
      )}
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

const REASON_BADGE_STYLES: Record<string, string> = {
  Defective: 'bg-gradient-to-r from-red-500 to-rose-600 border-0',
  'Wrong Item': 'bg-gradient-to-r from-orange-500 to-amber-500 border-0',
  'Not Satisfied': 'bg-gradient-to-r from-yellow-500 to-amber-500 border-0 text-amber-950',
  Damaged: 'bg-gradient-to-r from-purple-500 to-violet-600 border-0',
  Other: 'bg-gradient-to-r from-slate-500 to-slate-600 border-0',
};

export function getReasonBadge(reason: string) {
  return (
    <Badge className={REASON_BADGE_STYLES[reason] || 'bg-slate-100 text-slate-800'}>
      {reason}
    </Badge>
  );
}

export function NewReturnButton() {
  return (
    <Link href="/sales/returns/new">
      <Button
        size="lg"
        className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg shadow-orange-300/40 border-0 w-full sm:w-auto"
      >
        <Plus className="w-4 h-4 mr-2" />
        New Return
      </Button>
    </Link>
  );
}
