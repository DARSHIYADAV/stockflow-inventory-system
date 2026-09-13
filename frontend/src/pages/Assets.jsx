import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import AssetModal from '../components/AssetModal'
import BulkAssetModal from '../components/BulkAssetModal'
import AssignAssetModal from '../components/AssignAssetModal'
import AssetHistoryModal from '../components/AssetHistoryModal'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import { assignAsset, bulkCreateAssets, createAsset, listAssets, returnAsset } from '../api/assets'
import { listAssignableProducts } from '../api/products'
import { listAssignableUsers } from '../api/users'

const STATUS_FILTERS = ['all', 'available', 'assigned', 'retired']

export default function Assets() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'manager'
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)
  const [assigningAsset, setAssigningAsset] = useState(null)
  const [historyAsset, setHistoryAsset] = useState(null)
  const [formError, setFormError] = useState('')

  const { data: assets, isLoading, isError } = useQuery({
    queryKey: ['assets', statusFilter],
    queryFn: () => listAssets(statusFilter === 'all' ? undefined : statusFilter),
  })

  const { data: products } = useQuery({
    queryKey: ['assignable-products'],
    queryFn: listAssignableProducts,
    enabled: canManage,
  })
  const { data: users } = useQuery({
    queryKey: ['assignable-users'],
    queryFn: listAssignableUsers,
    enabled: canManage,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['assets'] })
  }

  const createMutation = useMutation({
    mutationFn: createAsset,
    onSuccess: () => {
      invalidate()
      setShowCreateModal(false)
      setFormError('')
    },
    onError: (err) => setFormError(err.response?.data?.detail || 'Failed to create asset'),
  })

  const assignMutation = useMutation({
    mutationFn: ({ assetId, payload }) => assignAsset(assetId, payload),
    onSuccess: () => {
      invalidate()
      setAssigningAsset(null)
      setFormError('')
    },
    onError: (err) => setFormError(err.response?.data?.detail || 'Failed to assign asset'),
  })

  const returnMutation = useMutation({
    mutationFn: (assetId) => returnAsset(assetId, {}),
    onSuccess: invalidate,
    onError: (err) => alert(err.response?.data?.detail || 'Failed to return asset'),
  })

  const bulkCreateMutation = useMutation({
    mutationFn: bulkCreateAssets,
    onSuccess: (result) => {
      invalidate()
      setBulkResult(result)
      setFormError('')
    },
    onError: (err) => setFormError(err.response?.data?.detail || 'Bulk creation failed'),
  })

  const employees = users || []

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-amber-400">Assets</h1>
        {canManage && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setBulkResult(null)
                setShowBulkModal(true)
              }}
              className="btn-secondary"
            >
              + Bulk Create
            </button>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              + Create Asset
            </button>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium capitalize transition-colors duration-150 ${
              statusFilter === s
                ? 'border-accent/40 bg-accent/15 text-accent'
                : 'border-border text-gray-400 hover:border-borderHover hover:bg-panelHover hover:text-gray-100'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading && <Spinner label="Loading assets..." />}
      {isError && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Failed to load assets.
        </p>
      )}

      {assets && (
        <div className="table-shell">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="table-head-cell text-amber-400/80">Asset Tag</th>
                <th className="table-head-cell text-amber-400/80">Product</th>
                <th className="table-head-cell text-amber-400/80">Serial</th>
                <th className="table-head-cell text-amber-400/80">Status</th>
                <th className="table-head-cell text-amber-400/80">Actions</th>
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
              {assets.map((asset) => (
                <tr key={asset.id} className="row-hover">
                  <td className="cell font-medium text-gray-100">{asset.asset_tag}</td>
                  <td className="cell text-gray-400">{asset.product_name || '—'}</td>
                  <td className="cell text-gray-400">{asset.serial_number || '—'}</td>
                  <td className="cell">
                    <StatusBadge status={asset.status} />
                  </td>
                  <td className="cell">
                    <div className="flex flex-wrap gap-2">
                      {canManage && asset.status === 'available' && (
                        <button onClick={() => setAssigningAsset(asset)} className="btn-xs">
                          Assign
                        </button>
                      )}
                      {canManage && asset.status === 'assigned' && (
                        <button onClick={() => returnMutation.mutate(asset.id)} className="btn-xs">
                          Return
                        </button>
                      )}
                      <button onClick={() => setHistoryAsset(asset)} className="btn-xs">
                        History
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <AssetModal
          products={products || []}
          onClose={() => {
            setShowCreateModal(false)
            setFormError('')
          }}
          onSubmit={(payload) => createMutation.mutate(payload)}
          submitting={createMutation.isPending}
          error={formError}
        />
      )}

      {assigningAsset && (
        <AssignAssetModal
          asset={assigningAsset}
          users={employees}
          onClose={() => {
            setAssigningAsset(null)
            setFormError('')
          }}
          onSubmit={(payload) => assignMutation.mutate({ assetId: assigningAsset.id, payload })}
          submitting={assignMutation.isPending}
          error={formError}
        />
      )}

      {historyAsset && (
        <AssetHistoryModal asset={historyAsset} onClose={() => setHistoryAsset(null)} />
      )}

      {showBulkModal && (
        <BulkAssetModal
          products={products || []}
          result={bulkResult}
          onClose={() => {
            setShowBulkModal(false)
            setBulkResult(null)
            setFormError('')
          }}
          onSubmit={(payload) => bulkCreateMutation.mutate(payload)}
          submitting={bulkCreateMutation.isPending}
          error={formError}
        />
      )}
    </Layout>
  )
}
