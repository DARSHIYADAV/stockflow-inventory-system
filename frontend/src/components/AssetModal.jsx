import { useState } from 'react'
import Modal from './Modal'

export default function AssetModal({ products, onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState({
    asset_tag: '',
    product_id: products[0]?.id || '',
    serial_number: '',
    purchase_date: '',
  })

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      ...form,
      serial_number: form.serial_number || null,
      purchase_date: form.purchase_date || null,
    })
  }

  return (
    <Modal title="Create Asset" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Asset Tag</label>
          <input
            required
            value={form.asset_tag}
            onChange={(e) => handleChange('asset_tag', e.target.value)}
            placeholder="e.g. AST-010"
            className="input-field"
          />
        </div>
        <div>
          <label className="field-label">Product</label>
          <select
            required
            value={form.product_id}
            onChange={(e) => handleChange('product_id', e.target.value)}
            className="select-field"
          >
            {products.length === 0 && <option value="">No products available</option>}
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Serial Number (optional)</label>
          <input
            value={form.serial_number}
            onChange={(e) => handleChange('serial_number', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="field-label">Purchase Date (optional)</label>
          <input
            type="date"
            value={form.purchase_date}
            onChange={(e) => handleChange('purchase_date', e.target.value)}
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
          <button
            type="submit"
            disabled={submitting || products.length === 0}
            className="btn-primary"
          >
            {submitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
