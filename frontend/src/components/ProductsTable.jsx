import Spinner from './Spinner'
import EmptyState from './EmptyState'
import Pagination, { PAGE_SIZE } from './Pagination'
import StatusBadge from './StatusBadge'

export default function ProductsTable({
  products,
  isLoading,
  isError,
  page,
  onPageChange,
  canManage,
  onStock,
  onHistory,
  onEdit,
  onDelete,
}) {
  if (isLoading) return <Spinner label="Loading products..." />
  if (isError) {
    return (
      <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        Failed to load products.
      </p>
    )
  }
  if (!products) return null

  return (
    <div className="table-shell">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border">
          <tr>
            <th className="table-head-cell text-emerald-700 dark:text-emerald-400/80">Name</th>
            <th className="table-head-cell text-emerald-700 dark:text-emerald-400/80">Category</th>
            <th className="table-head-cell text-emerald-700 dark:text-emerald-400/80">Supplier</th>
            <th className="table-head-cell text-emerald-700 dark:text-emerald-400/80">Quantity</th>
            <th className="table-head-cell text-emerald-700 dark:text-emerald-400/80">Status</th>
            <th className="table-head-cell text-emerald-700 dark:text-emerald-400/80">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.length === 0 && (
            <tr>
              <td colSpan={6}>
                <EmptyState message="No products yet." />
              </td>
            </tr>
          )}
          {products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((product) => {
            const isLow = product.quantity <= product.low_stock_threshold
            return (
              <tr key={product.id} className="row-hover">
                <td className="cell font-medium text-ink-primary">{product.name}</td>
                <td className="cell text-ink-secondary">{product.category}</td>
                <td className="cell text-ink-secondary">
                  {product.latest_supplier_name || product.supplier_name || '—'}
                </td>
                <td className="cell tabular-nums text-ink-primary">{product.quantity}</td>
                <td className="cell">
                  <StatusBadge status={isLow ? 'low' : 'ok'} label={isLow ? 'Low Stock' : 'OK'} />
                </td>
                <td className="cell">
                  <div className="flex flex-wrap gap-2">
                    {canManage && (
                      <button onClick={() => onStock(product)} className="btn-xs">
                        Stock
                      </button>
                    )}
                    <button onClick={() => onHistory(product)} className="btn-xs">
                      History
                    </button>
                    {canManage && (
                      <>
                        <button onClick={() => onEdit(product)} className="btn-xs">
                          Edit
                        </button>
                        <button onClick={() => onDelete(product)} className="btn-xs-danger">
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="px-4 pb-4">
        <Pagination page={page} totalItems={products.length} onPageChange={onPageChange} />
      </div>
    </div>
  )
}
