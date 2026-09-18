import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import AssetModal from '../components/AssetModal'
import BulkAssetModal from '../components/BulkAssetModal'
import AssignAssetModal from '../components/AssignAssetModal'
import AssetHistoryModal from '../components/AssetHistoryModal'
import AssetsTable from '../components/AssetsTable'
import { useAuth } from '../context/AuthContext'
import { assignAsset, bulkCreateAssets, createAsset, listAssets, returnAsset } from '../api/assets'
import { listAssignableProducts } from '../api/products'
import { listAssignableUsers } from '../api/users'

const STATUS_FILTERS = ['all', 'available', 'assigned']

export default function Assets() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'manager'
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
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
        <h1 className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">Assets</h1>
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
            onClick={() => {
              setStatusFilter(s)
              setPage(1)
            }}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium capitalize transition-colors duration-150 ${
              statusFilter === s
                ? 'border-accent/40 bg-accent/15 text-accent'
                : 'border-border text-ink-secondary hover:border-borderHover hover:bg-panelHover hover:text-ink-primary'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <AssetsTable
        assets={assets}
        isLoading={isLoading}
        isError={isError}
        page={page}
        onPageChange={setPage}
        canManage={canManage}
        onAssign={setAssigningAsset}
        onReturn={(assetId) => returnMutation.mutate(assetId)}
        onHistory={setHistoryAsset}
      />

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
