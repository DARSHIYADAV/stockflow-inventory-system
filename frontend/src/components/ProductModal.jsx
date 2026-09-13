import { useState } from 'react'
import Modal from './Modal'

const emptyForm = { name: '', category: '', supplier_name: '', low_stock_threshold: 0 }

export default function ProductModal({ product, onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState(
    product
      ? {
          name: product.name,
          category: product.category,
          supplier_name: product.supplier_name || '',
          low_stock_threshold: product.low_stock_threshold,
        }
      : emptyForm
  )

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      ...form,
      low_stock_threshold: Number(form.low_stock_threshold),
      supplier_name: form.supplier_name || null,
    })
  }

  return (
    <Modal title={product ? 'Edit Product' : 'Add Product'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="field-label">Category</label>
          <input
            required
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="field-label">Supplier</label>
          <input
            value={form.supplier_name}
            onChange={(e) => handleChange('supplier_name', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="field-label">Low Stock Threshold</label>
          <input
            type="number"
            min="0"
            required
            value={form.low_stock_threshold}
            onChange={(e) => handleChange('low_stock_threshold', e.target.value)}
            className="input-field"
          />
        </div>

        {error && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
