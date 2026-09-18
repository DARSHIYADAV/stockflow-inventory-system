import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import AddUserModal from '../components/AddUserModal'
import EditUserModal from '../components/EditUserModal'
import ResetPasswordModal from '../components/ResetPasswordModal'
import UsersTable from '../components/UsersTable'
import {
  createManagedUser,
  deactivateUser,
  listUsers,
  reactivateUser,
  resetUserPassword,
  updateManagedUser,
  updateUserRole,
} from '../api/users'
import { useAuth } from '../context/AuthContext'

export default function Users() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const [page, setPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
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

  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }) => updateManagedUser(id, payload),
    onSuccess: () => {
      invalidate()
      setEditTarget(null)
      setFormError('')
    },
    onError: (err) => setFormError(err.response?.data?.detail || 'Failed to update user'),
  })

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: invalidate,
    onError: (err) => alert(err.response?.data?.detail || 'Failed to deactivate user'),
  })

  const reactivateMutation = useMutation({
    mutationFn: reactivateUser,
    onSuccess: invalidate,
    onError: (err) => alert(err.response?.data?.detail || 'Failed to reactivate user'),
  })

  function handleDeactivate(u) {
    if (confirm(`Deactivate ${u.name}? They will no longer be able to log in or be assigned assets.`)) {
      deactivateMutation.mutate(u.id)
    }
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-violet-600 dark:text-violet-400">Users</h1>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          + Add User
        </button>
      </div>

      <UsersTable
        users={users}
        isLoading={isLoading}
        isError={isError}
        page={page}
        onPageChange={setPage}
        currentUser={currentUser}
        updateRoleMutation={updateRoleMutation}
        onEdit={(u) => {
          setEditTarget(u)
          setFormError('')
        }}
        onResetPassword={(u) => {
          setResetTarget(u)
          setFormError('')
        }}
        onDeactivate={handleDeactivate}
        reactivateMutation={reactivateMutation}
      />

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

      {editTarget && (
        <EditUserModal
          user={editTarget}
          onClose={() => {
            setEditTarget(null)
            setFormError('')
          }}
          onSubmit={(payload) => updateUserMutation.mutate({ id: editTarget.id, payload })}
          submitting={updateUserMutation.isPending}
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
