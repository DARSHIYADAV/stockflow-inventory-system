import { useState } from 'react'
import Modal from './Modal'

export default function BulkAssetModal({ products, onClose, onSubmit, submitting, error, result }) {
  const [form, setForm] = useState({
    product_id: products[0]?.id || '',
    tag_prefix: 'AST-',
    start_number: 1,
    count: 10,
    pad_width: 3,
    purchase_date: '',
  })

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      ...form,
      start_number: Number(form.start_number),
      count: Number(form.count),
      pad_width: Number(form.pad_width),
      purchase_date: form.purchase_date || null,
    })
  }

  const previewEnd = Number(form.start_number) + Number(form.count) - 1
  const previewFirst = `${form.tag_prefix}${String(form.start_number).padStart(form.pad_width, '0')}`
  const previewLast = `${form.tag_prefix}${String(previewEnd).padStart(form.pad_width, '0')}`

  return (
    <Modal title="Bulk Create Assets" onClose={onClose}>
      {result ? (
        <div className="space-y-3">
          <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            Created {result.created.length} asset{result.created.length === 1 ? '' : 's'}.
          </p>
          {result.skipped_tags.length > 0 && (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
              Skipped {result.skipped_tags.length} already-existing tag
              {result.skipped_tags.length === 1 ? '' : 's'}: {result.skipped_tags.join(', ')}
            </p>
          )}
          <div className="flex justify-end pt-2">
            <button onClick={onClose} className="btn-primary">
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="field-label">Tag Prefix</label>
            <input
              required
              value={form.tag_prefix}
              onChange={(e) => handleChange('tag_prefix', e.target.value)}
              placeholder="e.g. AST-"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="field-label">Start #</label>
              <input
                type="number"
                min="0"
                required
                value={form.start_number}
                onChange={(e) => handleChange('start_number', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label">Count</label>
              <input
                type="number"
                min="1"
                max="500"
                required
                value={form.count}
                onChange={(e) => handleChange('count', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label">Zero-pad</label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={form.pad_width}
                onChange={(e) => handleChange('pad_width', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {form.count > 0 && (
            <p className="rounded-md bg-panel2 px-3 py-2 text-xs text-gray-500">
              Will create <span className="font-medium text-gray-300">{previewFirst}</span> through{' '}
              <span className="font-medium text-gray-300">{previewLast}</span> (existing tags are
              skipped automatically)
            </p>
          )}

          <div>
            <label className="field-label">Purchase Date (optional, applied to all)</label>
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
              {submitting ? 'Creating...' : 'Create Assets'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
