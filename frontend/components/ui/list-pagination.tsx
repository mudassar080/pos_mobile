'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PAGE_SIZE_OPTIONS, type PaginationMeta } from '@/lib/pagination';

type ListPaginationProps = {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: readonly number[];
  className?: string;
};

export function ListPagination({
  pagination,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  className,
}: ListPaginationProps) {
  const { page, limit, total, pages } = pagination;
  const currentPageSize = pageSize ?? limit;

  if (total === 0) {
    return null;
  }

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t border-slate-100 pt-4 lg:flex-row lg:items-center lg:justify-between',
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-700">{start}</span>–
          <span className="font-medium text-slate-700">{end}</span> of{' '}
          <span className="font-medium text-slate-700">{total}</span>
        </p>

        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 whitespace-nowrap">Rows per page</span>
            <Select
              value={String(currentPageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[72px] rounded-lg text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-slate-600 min-w-[100px] text-center">
            Page {page} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
