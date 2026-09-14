import { useState } from 'react'
import Modal from './Modal'

const COMPANY_EMAIL_DOMAIN = '@staunchsys.com'

export default function EditUserModal({ user, onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState({ name: user.name, email: user.email })
  const [localError, setLocalError] = useState('')

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.email.toLowerCase().endsWith(COMPANY_EMAIL_DOMAIN)) {
      setLocalError(`Email must end with ${COMPANY_EMAIL_DOMAIN}`)
      return
    }
    setLocalError('')
    onSubmit(form)
  }

  return (
    <Modal title="Edit User" onClose={onClose}>
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
          <label className="field-label">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="name@staunchsys.com"
            className="input-field"
          />
          <p className="mt-1.5 text-xs text-ink-muted">Must be a @staunchsys.com email address.</p>
        </div>

        {(localError || error) && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {localError || error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
