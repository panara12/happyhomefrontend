import { ChevronLeft, ChevronRight } from 'lucide-react';

const ELLIPSIS = '…';

// Windowed page list, e.g. [1, '…', 4, 5, 6, '…', 20] — keeps the control
// usable when there are many pages instead of rendering every page number.
function getPageNumbers(current, total) {
  const delta = 1;
  const range = [];
  const withDots = [];
  let last;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }

  for (const i of range) {
    if (last !== undefined) {
      if (i - last === 2) {
        withDots.push(last + 1);
      } else if (i - last !== 1) {
        withDots.push(ELLIPSIS);
      }
    }
    withDots.push(i);
    last = i;
  }

  return withDots;
}

export function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
  if (totalItems === 0 || totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-3">
      <p className="text-sm text-gray-600">
        Showing <span className="font-medium">{start}</span>–<span className="font-medium">{end}</span> of{' '}
        <span className="font-medium">{totalItems}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {pageNumbers.map((n, i) =>
          n === ELLIPSIS ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-gray-400 select-none">
              {ELLIPSIS}
            </span>
          ) : (
            <button
              type="button"
              key={n}
              onClick={() => onPageChange(n)}
              aria-current={n === page ? 'page' : undefined}
              className={`min-w-[2.25rem] px-2 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                n === page
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {n}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
