import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getHomePath } from '../utils/roleHome'

const VALID_ROLES = ['admin', 'manager', 'employee']
const ROLE_LABELS = { admin: 'Admin', manager: 'Manager', employee: 'Employee' }

export default function Login() {
  const { role } = useParams()
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!VALID_ROLES.includes(role)) {
    return <Navigate to="/login/admin" replace />
  }

  if (user) {
    return <Navigate to={getHomePath(user.role)} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const loggedInUser = await login(email, password, role)
      navigate(getHomePath(loggedInUser.role))
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm animate-scale-in rounded-card border border-border bg-panel p-8 shadow-modal">
        <h1 className="mb-1 text-center text-2xl font-bold tracking-tight text-white">
          StockFlow
        </h1>
        <p className="mb-7 text-center text-sm text-gray-500">
          Sign in as{' '}
          <span className="font-medium text-gray-200">{ROLE_LABELS[role]}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting && <span className="spinner h-4 w-4 border-white/30 border-t-white" />}
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 flex justify-center gap-4 border-t border-border pt-5 text-xs text-gray-500">
          {VALID_ROLES.filter((r) => r !== role).map((r) => (
            <Link
              key={r}
              to={`/login/${r}`}
              className="transition-colors duration-150 hover:text-accent"
            >
              Sign in as {ROLE_LABELS[r]}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
