import { useQuery } from '@tanstack/react-query'
import Modal from './Modal'
import Spinner from './Spinner'
import EmptyState from './EmptyState'
import { getStockHistory } from '../api/products'

export default function StockHistoryModal({ product, onClose }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['stock-history', product.id],
    queryFn: () => getStockHistory(product.id),
  })

  return (
    <Modal title={`Stock History: ${product.name}`} onClose={onClose}>
      {isLoading && <Spinner label="Loading history..." />}
      {isError && <p className="text-sm text-red-400">Failed to load history.</p>}
      {data && (
        <div className="max-h-80 space-y-2.5 overflow-y-auto">
          {data.length === 0 && <EmptyState message="No stock transactions for this product yet." />}
          {[...data].reverse().map((entry) => (
            <div
              key={entry.id}
              className="rounded-md border border-border bg-panel2 p-3 transition-colors duration-150 hover:border-borderHover"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-semibold ${
                    entry.change_quantity > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {entry.change_quantity > 0 ? '+' : ''}
                  {entry.change_quantity}
                </span>
                <span className="whitespace-nowrap text-xs text-ink-muted">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </div>
              {entry.supplier_name && (
                <p className="mt-1 text-sm text-ink-secondary">Supplier: {entry.supplier_name}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
