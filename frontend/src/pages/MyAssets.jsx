import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import AssetHistoryModal from '../components/AssetHistoryModal'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import { getAssetHistory, listMyAssets } from '../api/assets'

function AssetRow({ asset, onViewHistory }) {
  const { data: history } = useQuery({
    queryKey: ['asset-history', asset.id],
    queryFn: () => getAssetHistory(asset.id),
  })

  const lastAssignedEntry = [...(history || [])].reverse().find((h) => h.action === 'assigned')

  return (
    <tr className="row-hover">
      <td className="cell font-medium text-gray-100">{asset.asset_tag}</td>
      <td className="cell text-gray-400">{asset.product_name || '—'}</td>
      <td className="cell text-gray-400">
        {lastAssignedEntry ? new Date(lastAssignedEntry.created_at).toLocaleDateString() : '—'}
      </td>
      <td className="cell">
        <StatusBadge status={asset.status} />
      </td>
      <td className="cell">
        <button onClick={() => onViewHistory(asset)} className="btn-xs">
          History
        </button>
      </td>
    </tr>
  )
}

export default function MyAssets() {
  const [historyAsset, setHistoryAsset] = useState(null)

  const { data: assets, isLoading, isError } = useQuery({
    queryKey: ['my-assets'],
    queryFn: listMyAssets,
  })

  return (
    <Layout>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-cyan-400">My Assets</h1>

      {isLoading && <Spinner label="Loading your assets..." />}
      {isError && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Failed to load your assets.
        </p>
      )}

      {assets && (
        <div className="table-shell">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="table-head-cell text-cyan-400/80">Asset Tag</th>
                <th className="table-head-cell text-cyan-400/80">Product</th>
                <th className="table-head-cell text-cyan-400/80">Assigned On</th>
                <th className="table-head-cell text-cyan-400/80">Status</th>
                <th className="table-head-cell text-cyan-400/80">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assets.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message="No equipment currently assigned to you." />
                  </td>
                </tr>
              )}
              {assets.map((asset) => (
                <AssetRow key={asset.id} asset={asset} onViewHistory={setHistoryAsset} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {historyAsset && (
        <AssetHistoryModal asset={historyAsset} onClose={() => setHistoryAsset(null)} />
      )}
    </Layout>
  )
}
