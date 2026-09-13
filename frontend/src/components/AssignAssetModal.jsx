import { useState } from 'react'
import Modal from './Modal'

export default function AssignAssetModal({ asset, users, onClose, onSubmit, submitting, error }) {
  const [employeeId, setEmployeeId] = useState(users[0]?.id || '')
  const [note, setNote] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({ employee_id: employeeId, note: note || null })
  }

  return (
    <Modal title={`Assign: ${asset.asset_tag}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Employee</label>
          <select
            required
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="select-field"
          >
            {users.length === 0 && <option value="">No users available</option>}
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. issued for onboarding"
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
          <button type="submit" disabled={submitting || users.length === 0} className="btn-primary">
            {submitting ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
