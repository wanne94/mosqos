import { useState, useMemo, useCallback } from 'react';

export interface PaginationConfig {
  initialPage?: number;
  initialPageSize?: number;
  total?: number;
  siblingCount?: number;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginationHandlers {
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setTotal: (total: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  canNextPage: boolean;
  canPrevPage: boolean;
}

export interface PaginationMeta {
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  pageRange: (number | 'ellipsis')[];
}

export type UsePaginationReturn = PaginationState &
  PaginationHandlers &
  PaginationMeta;

/**
 * Hook for handling pagination logic
 *
 * @param config - Pagination configuration
 * @returns Pagination state, handlers, and computed values
 *
 * @example
 * const pagination = usePagination({ total: 100, initialPageSize: 10 });
 *
 * // In your component
 * <Button onClick={pagination.prevPage} disabled={!pagination.canPrevPage}>
 *   Previous
 * </Button>
 * <span>Page {pagination.page} of {pagination.totalPages}</span>
 * <Button onClick={pagination.nextPage} disabled={!pagination.canNextPage}>
 *   Next
 * </Button>
 */
export function usePagination(config: PaginationConfig = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    initialPageSize = 10,
    total: initialTotal = 0,
    siblingCount = 1,
  } = config;

  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [total, setTotalState] = useState(initialTotal);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  // Ensure page is within bounds when total or pageSize changes
  const safePage = useMemo(() => {
    return Math.min(Math.max(1, page), totalPages);
  }, [page, totalPages]);

  const setPage = useCallback(
    (newPage: number) => {
      const boundedPage = Math.min(Math.max(1, newPage), totalPages);
      setPageState(boundedPage);
    },
    [totalPages]
  );

  const setPageSize = useCallback(
    (newPageSize: number) => {
      setPageSizeState(newPageSize);
      // Reset to first page when page size changes
      setPageState(1);
    },
    []
  );

  const setTotal = useCallback((newTotal: number) => {
    setTotalState(Math.max(0, newTotal));
  }, []);

  const nextPage = useCallback(() => {
    setPage(safePage + 1);
  }, [safePage, setPage]);

  const prevPage = useCallback(() => {
    setPage(safePage - 1);
  }, [safePage, setPage]);

  const firstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const lastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages, setPage]);

  const canNextPage = safePage < totalPages;
  const canPrevPage = safePage > 1;
  const hasNextPage = canNextPage;
  const hasPrevPage = canPrevPage;

  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, total - 1);

  // Generate page range with ellipsis
  const pageRange = useMemo((): (number | 'ellipsis')[] => {
    const totalPageNumbers = siblingCount * 2 + 5; // siblings + first + last + current + 2 ellipsis

    if (totalPages <= totalPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(safePage - siblingCount, 1);
    const rightSiblingIndex = Math.min(safePage + siblingCount, totalPages);

    const showLeftEllipsis = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalPages - 1;

    if (!showLeftEllipsis && showRightEllipsis) {
      const leftRange = Array.from(
        { length: siblingCount * 2 + 3 },
        (_, i) => i + 1
      );
      return [...leftRange, 'ellipsis', totalPages];
    }

    if (showLeftEllipsis && !showRightEllipsis) {
      const rightRange = Array.from(
        { length: siblingCount * 2 + 3 },
        (_, i) => totalPages - (siblingCount * 2 + 2) + i
      );
      return [1, 'ellipsis', ...rightRange];
    }

    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [1, 'ellipsis', ...middleRange, 'ellipsis', totalPages];
  }, [safePage, totalPages, siblingCount]);

  return {
    // State
    page: safePage,
    pageSize,
    total,
    // Handlers
    setPage,
    setPageSize,
    setTotal,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    canNextPage,
    canPrevPage,
    // Meta
    totalPages,
    startIndex,
    endIndex,
    hasNextPage,
    hasPrevPage,
    pageRange,
  };
}

/**
 * Helper function to get pagination params for API requests
 */
export function getPaginationParams(pagination: Pick<PaginationState, 'page' | 'pageSize'>) {
  return {
    skip: (pagination.page - 1) * pagination.pageSize,
    take: pagination.pageSize,
    page: pagination.page,
    limit: pagination.pageSize,
  };
}
