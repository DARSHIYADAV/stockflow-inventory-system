export const PAGE_SIZE = 5

function getPageNumbers(page, totalPages) {
  const pages = new Set([1, totalPages, page, page - 1, page + 1])
  return [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b)
}

export default function Pagination({ page, totalItems, pageSize = PAGE_SIZE, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  if (totalPages <= 1) return null

  const pageNumbers = getPageNumbers(page, totalPages)

  return (
    <div className="mt-4 flex items-center justify-end gap-1.5">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex h-8 w-8 items-center justify-center rounded-md text-ink-secondary transition-colors duration-150 hover:bg-panelHover hover:text-ink-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        ‹
      </button>

      {pageNumbers.map((p, i) => {
        const prev = pageNumbers[i - 1]
        const showEllipsis = prev !== undefined && p - prev > 1
        return (
          <span key={p} className="flex items-center gap-1.5">
            {showEllipsis && <span className="px-1 text-ink-muted">…</span>}
            <button
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-semibold transition-colors duration-150 ${
                p === page
                  ? 'bg-accent text-white'
                  : 'text-ink-secondary hover:bg-panelHover hover:text-ink-primary'
              }`}
            >
              {p}
            </button>
          </span>
        )
      })}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="flex h-8 w-8 items-center justify-center rounded-md text-ink-secondary transition-colors duration-150 hover:bg-panelHover hover:text-ink-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        ›
      </button>
    </div>
  )
}
