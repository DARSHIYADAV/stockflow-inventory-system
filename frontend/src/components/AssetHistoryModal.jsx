import { useQuery } from '@tanstack/react-query'
import Modal from './Modal'
import Spinner from './Spinner'
import EmptyState from './EmptyState'
import { getAssetHistory } from '../api/assets'

export default function AssetHistoryModal({ asset, onClose }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['asset-history', asset.id],
    queryFn: () => getAssetHistory(asset.id),
  })

  return (
    <Modal title={`History: ${asset.asset_tag}`} onClose={onClose}>
      {isLoading && <Spinner label="Loading history..." />}
      {isError && <p className="text-sm text-red-400">Failed to load history.</p>}
      {data && (
        <div className="max-h-80 space-y-2.5 overflow-y-auto">
          {data.length === 0 && <EmptyState message="No history for this asset yet." />}
          {data.map((entry) => (
            <div
              key={entry.id}
              className="rounded-md border border-border bg-panel2 p-3 transition-colors duration-150 hover:border-borderHover"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-semibold capitalize ${
                    entry.action === 'assigned' ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {entry.action}
                </span>
                <span className="whitespace-nowrap text-xs text-gray-500">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </div>
              {entry.note && <p className="mt-1 text-sm text-gray-400">{entry.note}</p>}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
