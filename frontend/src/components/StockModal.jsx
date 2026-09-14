import { useState } from 'react'
import Modal from './Modal'

export default function StockModal({ product, onClose, onSubmit, submitting, error }) {
  const [direction, setDirection] = useState('in')
  const [amount, setAmount] = useState('')
  const [supplierName, setSupplierName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const magnitude = Math.abs(Number(amount))
    const change_quantity = direction === 'in' ? magnitude : -magnitude
    onSubmit({
      change_quantity,
      supplier_name: direction === 'in' ? supplierName || null : null,
    })
  }

  return (
    <Modal title={`Stock: ${product.name}`} onClose={onClose}>
      <p className="mb-4 text-sm text-ink-secondary">
        Current quantity: <span className="font-medium text-ink-primary">{product.quantity}</span>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDirection('in')}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-all duration-150 ${
              direction === 'in'
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                : 'border-border text-ink-secondary hover:border-borderHover hover:bg-panelHover'
            }`}
          >
            Stock In
          </button>
          <button
            type="button"
            onClick={() => setDirection('out')}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-all duration-150 ${
              direction === 'out'
                ? 'border-red-500/40 bg-red-500/15 text-red-400'
                : 'border-border text-ink-secondary hover:border-borderHover hover:bg-panelHover'
            }`}
          >
            Stock Out
          </button>
        </div>

        <div>
          <label className="field-label">Quantity</label>
          <input
            type="number"
            min="1"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field"
          />
        </div>
        {direction === 'in' && (
          <div>
            <label className="field-label">Supplier (optional)</label>
            <input
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g. Dell Inc"
              className="input-field"
            />
          </div>
        )}

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
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
