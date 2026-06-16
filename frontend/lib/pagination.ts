export const DEFAULT_PAGE_SIZE = 20;

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const emptyPagination = (limit = DEFAULT_PAGE_SIZE): PaginationMeta => ({
  page: 1,
  limit,
  total: 0,
  pages: 1,
});

/** Params for non-paginated UI fetches (dropdowns, reports, etc.) */
export function paginatedParams(
  limit: number,
  page = 1
): Record<string, string> {
  return { page: String(page), limit: String(limit) };
}
