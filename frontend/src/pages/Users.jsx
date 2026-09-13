import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import AddUserModal from '../components/AddUserModal'
import ResetPasswordModal from '../components/ResetPasswordModal'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import RoleBadge from '../components/RoleBadge'
import { createManagedUser, listUsers, resetUserPassword, updateUserRole } from '../api/users'
import { useAuth } from '../context/AuthContext'

// Admin can never be assigned here — only via the bootstrap-first-admin
// flow. This dropdown only ever moves a user between these two roles.
const EDITABLE_ROLES = ['manager', 'employee']

export default function Users() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const [showAddModal, setShowAddModal] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)
  const [formError, setFormError] = useState('')

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => updateUserRole(id, role),
    onSuccess: invalidate,
    onError: (err) => alert(err.response?.data?.detail || 'Failed to update role'),
  })

  const createUserMutation = useMutation({
    mutationFn: createManagedUser,
    onSuccess: () => {
      invalidate()
      setShowAddModal(false)
      setFormError('')
    },
    onError: (err) => setFormError(err.response?.data?.detail || 'Failed to create user'),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }) => resetUserPassword(id, newPassword),
    onSuccess: () => {
      setResetTarget(null)
      setFormError('')
    },
    onError: (err) => setFormError(err.response?.data?.detail || 'Failed to reset password'),
  })

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-violet-400">Users</h1>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          + Add User
        </button>
      </div>

      {isLoading && <Spinner label="Loading users..." />}
      {isError && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Failed to load users.
        </p>
      )}

      {users && (
        <div className="table-shell">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="table-head-cell text-violet-400/80">Name</th>
                <th className="table-head-cell text-violet-400/80">Email</th>
                <th className="table-head-cell text-violet-400/80">Role</th>
                <th className="table-head-cell text-violet-400/80">Joined</th>
                <th className="table-head-cell text-violet-400/80">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message="No users yet." />
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="row-hover">
                  <td className="cell font-medium text-gray-100">
                    {u.name}
                    {u.id === currentUser?.id && (
                      <span className="ml-2 text-xs font-normal text-gray-500">(you)</span>
                    )}
                  </td>
                  <td className="cell text-gray-400">{u.email}</td>
                  <td className="cell">
                    {u.role !== 'admin' ? (
                      <select
                        value={u.role}
                        onChange={(e) =>
                          updateRoleMutation.mutate({ id: u.id, role: e.target.value })
                        }
                        disabled={updateRoleMutation.isPending}
                        className="select-field py-1.5 pr-8 text-sm"
                      >
                        {EDITABLE_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <RoleBadge role={u.role} />
                    )}
                  </td>
                  <td className="cell text-gray-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="cell">
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => {
                          setResetTarget(u)
                          setFormError('')
                        }}
                        className="btn-xs"
                      >
                        Reset Password
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddUserModal
          onClose={() => {
            setShowAddModal(false)
            setFormError('')
          }}
          onSubmit={(payload) => createUserMutation.mutate(payload)}
          submitting={createUserMutation.isPending}
          error={formError}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          targetUser={resetTarget}
          onClose={() => {
            setResetTarget(null)
            setFormError('')
          }}
          onSubmit={(newPassword) =>
            resetPasswordMutation.mutate({ id: resetTarget.id, newPassword })
          }
          submitting={resetPasswordMutation.isPending}
          error={formError}
        />
      )}
    </Layout>
  )
}
