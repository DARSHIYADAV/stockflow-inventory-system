import { useState } from 'react'
import Layout from '../components/Layout'
import { changePassword } from '../api/auth'

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match')
      return
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from your current password')
      return
    }

    setSubmitting(true)
    try {
      await changePassword(currentPassword, newPassword)
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">Change Password</h1>

      <div className="max-w-md card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="field-label">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="field-label">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
            />
          </div>

          {error && (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
              Password changed successfully.
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving...' : 'Change Password'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
