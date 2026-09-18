import Spinner from './Spinner'
import EmptyState from './EmptyState'
import Pagination, { PAGE_SIZE } from './Pagination'
import StatusBadge from './StatusBadge'

export default function AssetsTable({
  assets,
  isLoading,
  isError,
  page,
  onPageChange,
  canManage,
  onAssign,
  onReturn,
  onHistory,
}) {
  if (isLoading) return <Spinner label="Loading assets..." />
  if (isError) {
    return (
      <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        Failed to load assets.
      </p>
    )
  }
  if (!assets) return null

  return (
    <div className="table-shell">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border">
          <tr>
            <th className="table-head-cell text-amber-700 dark:text-amber-400/80">Asset Tag</th>
            <th className="table-head-cell text-amber-700 dark:text-amber-400/80">Product</th>
            <th className="table-head-cell text-amber-700 dark:text-amber-400/80">Serial</th>
            <th className="table-head-cell text-amber-700 dark:text-amber-400/80">Status</th>
            <th className="table-head-cell text-amber-700 dark:text-amber-400/80">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {assets.length === 0 && (
            <tr>
              <td colSpan={5}>
                <EmptyState message="No assets found." />
              </td>
            </tr>
          )}
          {assets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((asset) => (
            <tr key={asset.id} className="row-hover">
              <td className="cell font-medium text-ink-primary">{asset.asset_tag}</td>
              <td className="cell text-ink-secondary">{asset.product_name || '—'}</td>
              <td className="cell text-ink-secondary">{asset.serial_number || '—'}</td>
              <td className="cell">
                <StatusBadge status={asset.status} />
              </td>
              <td className="cell">
                <div className="flex flex-wrap gap-2">
                  {canManage && asset.status === 'available' && (
                    <button onClick={() => onAssign(asset)} className="btn-xs">
                      Assign
                    </button>
                  )}
                  {canManage && asset.status === 'assigned' && (
                    <button onClick={() => onReturn(asset.id)} className="btn-xs">
                      Return
                    </button>
                  )}
                  <button onClick={() => onHistory(asset)} className="btn-xs">
                    History
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 pb-4">
        <Pagination page={page} totalItems={assets.length} onPageChange={onPageChange} />
      </div>
    </div>
  )
}
