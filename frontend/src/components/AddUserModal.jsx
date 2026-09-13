import { useState } from 'react'
import Modal from './Modal'

export default function AddUserModal({ onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' })

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <Modal title="Add User" onClose={onClose}>
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
            className="input-field"
          />
        </div>
        <div>
          <label className="field-label">Password</label>
          <input
            type="text"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder="Set their initial password"
            className="input-field"
          />
        </div>
        <div>
          <label className="field-label">Role</label>
          <select value={form.role} onChange={(e) => handleChange('role', e.target.value)} className="select-field">
            <option value="employee">employee</option>
            <option value="manager">manager</option>
          </select>
          <p className="mt-1.5 text-xs text-gray-500">
            Admin accounts can't be created here — only manager or employee.
          </p>
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
            {submitting ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
