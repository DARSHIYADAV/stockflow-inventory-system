import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import ProductModal from '../components/ProductModal'
import StockModal from '../components/StockModal'
import StockHistoryModal from '../components/StockHistoryModal'
import ProductsTable from '../components/ProductsTable'
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
  const [page, setPage] = useState(1)
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
        <h1 className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">Products</h1>
        {canManage && (
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            + Add Product
          </button>
        )}
      </div>

      <ProductsTable
        products={products}
        isLoading={isLoading}
        isError={isError}
        page={page}
        onPageChange={setPage}
        canManage={canManage}
        onStock={setStockProduct}
        onHistory={setHistoryProduct}
        onEdit={setEditingProduct}
        onDelete={handleDelete}
      />

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
