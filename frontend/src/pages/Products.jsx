import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import ProductModal from '../components/ProductModal'
import StockModal from '../components/StockModal'
import StockHistoryModal from '../components/StockHistoryModal'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import {
  createProduct,
  createStockTransaction,
  deleteProduct,
  listProducts,
  updateProduct,
} from '../api/products'

export default function Products() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'manager'
  const [editingProduct, setEditingProduct] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [stockProduct, setStockProduct] = useState(null)
  const [historyProduct, setHistoryProduct] = useState(null)
  const [formError, setFormError] = useState('')

  const { data: products, isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: listProducts,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      invalidate()
      setShowAddModal(false)
      setFormError('')
    },
    onError: (err) => setFormError(err.response?.data?.detail || 'Failed to create product'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateProduct(id, payload),
    onSuccess: () => {
      invalidate()
      setEditingProduct(null)
      setFormError('')
    },
    onError: (err) => setFormError(err.response?.data?.detail || 'Failed to update product'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: invalidate,
    onError: (err) => alert(err.response?.data?.detail || 'Failed to delete product'),
  })

  const stockMutation = useMutation({
    mutationFn: ({ productId, payload }) => createStockTransaction(productId, payload),
    onSuccess: () => {
      invalidate()
      setStockProduct(null)
      setFormError('')
    },
    onError: (err) => setFormError(err.response?.data?.detail || 'Stock transaction failed'),
  })

  function handleDelete(product) {
    if (confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(product.id)
    }
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-emerald-400">Products</h1>
        {canManage && (
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            + Add Product
          </button>
        )}
      </div>

      {isLoading && <Spinner label="Loading products..." />}
      {isError && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Failed to load products.
        </p>
      )}

      {products && (
        <div className="table-shell">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="table-head-cell text-emerald-400/80">Name</th>
                <th className="table-head-cell text-emerald-400/80">Category</th>
                <th className="table-head-cell text-emerald-400/80">Supplier</th>
                <th className="table-head-cell text-emerald-400/80">Quantity</th>
                <th className="table-head-cell text-emerald-400/80">Status</th>
                <th className="table-head-cell text-emerald-400/80">Actions</th>
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
              {products.map((product) => {
                const isLow = product.quantity <= product.low_stock_threshold
                return (
                  <tr key={product.id} className="row-hover">
                    <td className="cell font-medium text-gray-100">{product.name}</td>
                    <td className="cell text-gray-400">{product.category}</td>
                    <td className="cell text-gray-400">
                      {product.latest_supplier_name || product.supplier_name || '—'}
                    </td>
                    <td className="cell tabular-nums text-gray-100">{product.quantity}</td>
                    <td className="cell">
                      <StatusBadge status={isLow ? 'low' : 'ok'} label={isLow ? 'Low Stock' : 'OK'} />
                    </td>
                    <td className="cell">
                      <div className="flex flex-wrap gap-2">
                        {canManage && (
                          <button onClick={() => setStockProduct(product)} className="btn-xs">
                            Stock
                          </button>
                        )}
                        <button onClick={() => setHistoryProduct(product)} className="btn-xs">
                          History
                        </button>
                        {canManage && (
                          <>
                            <button onClick={() => setEditingProduct(product)} className="btn-xs">
                              Edit
                            </button>
                            <button onClick={() => handleDelete(product)} className="btn-xs-danger">
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
        </div>
      )}

      {showAddModal && (
        <ProductModal
          onClose={() => {
            setShowAddModal(false)
            setFormError('')
          }}
          onSubmit={(payload) => createMutation.mutate(payload)}
          submitting={createMutation.isPending}
          error={formError}
        />
      )}

      {editingProduct && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setEditingProduct(null)
            setFormError('')
          }}
          onSubmit={(payload) => updateMutation.mutate({ id: editingProduct.id, payload })}
          submitting={updateMutation.isPending}
          error={formError}
        />
      )}

      {stockProduct && (
        <StockModal
          product={stockProduct}
          onClose={() => {
            setStockProduct(null)
            setFormError('')
          }}
          onSubmit={(payload) => stockMutation.mutate({ productId: stockProduct.id, payload })}
          submitting={stockMutation.isPending}
          error={formError}
        />
      )}

      {historyProduct && (
        <StockHistoryModal product={historyProduct} onClose={() => setHistoryProduct(null)} />
      )}
    </Layout>
  )
}
