'use client';

import { useLayoutEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export const STAT_GRID_CLASS =
  'grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))]';

export function SummaryStatGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(STAT_GRID_CLASS, className)}>{children}</div>;
}

export function FitValue({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const container = el?.parentElement;
    if (!el || !container) return;

    const fit = () => {
      el.style.fontSize = '';
      el.style.whiteSpace = 'nowrap';
      el.style.wordBreak = 'normal';

      let size = parseFloat(getComputedStyle(el).fontSize);
      const minSize = 11;

      while (el.scrollWidth > container.clientWidth && size > minSize) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }

      if (el.scrollWidth > container.clientWidth) {
        el.style.whiteSpace = 'normal';
        el.style.wordBreak = 'break-word';
        el.style.fontSize = `${Math.max(minSize, size)}px`;
      }
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => observer.disconnect();
  }, [value]);

  return (
    <p
      ref={ref}
      className={cn('mt-1 text-xl sm:text-2xl font-bold tracking-tight leading-tight', className)}
    >
      {value}
    </p>
  );
}
