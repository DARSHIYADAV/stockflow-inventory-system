import { useState } from 'react'
import Modal from './Modal'

export default function ResetPasswordModal({ targetUser, onClose, onSubmit, submitting, error }) {
  const [newPassword, setNewPassword] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(newPassword)
  }

  return (
    <Modal title={`Reset Password: ${targetUser.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">New Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Set a new password for this user"
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
            {submitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
