import Spinner from './Spinner'
import EmptyState from './EmptyState'
import RoleBadge from './RoleBadge'
import Pagination, { PAGE_SIZE } from './Pagination'
import StatusBadge from './StatusBadge'

// Admin can never be assigned here — only via the bootstrap-first-admin
// flow. This dropdown only ever moves a user between these two roles.
const EDITABLE_ROLES = ['manager', 'employee']

export default function UsersTable({
  users,
  isLoading,
  isError,
  page,
  onPageChange,
  currentUser,
  updateRoleMutation,
  onEdit,
  onResetPassword,
  onDeactivate,
  reactivateMutation,
}) {
  if (isLoading) return <Spinner label="Loading users..." />
  if (isError) {
    return (
      <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        Failed to load users.
      </p>
    )
  }
  if (!users) return null

  return (
    <div className="table-shell">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border">
          <tr>
            <th className="table-head-cell text-violet-700 dark:text-violet-400/80">Name</th>
            <th className="table-head-cell text-violet-700 dark:text-violet-400/80">Email</th>
            <th className="table-head-cell text-violet-700 dark:text-violet-400/80">Role</th>
            <th className="table-head-cell text-violet-700 dark:text-violet-400/80">Status</th>
            <th className="table-head-cell text-violet-700 dark:text-violet-400/80">Joined</th>
            <th className="table-head-cell text-violet-700 dark:text-violet-400/80">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.length === 0 && (
            <tr>
              <td colSpan={6}>
                <EmptyState message="No users yet." />
              </td>
            </tr>
          )}
          {users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((u) => (
            <tr key={u.id} className="row-hover">
              <td className="cell font-medium text-ink-primary">
                {u.name}
                {u.id === currentUser?.id && (
                  <span className="ml-2 text-xs font-normal text-ink-muted">(you)</span>
                )}
              </td>
              <td className="cell text-ink-secondary">{u.email}</td>
              <td className="cell">
                {u.role !== 'admin' ? (
                  <select
                    value={u.role}
                    onChange={(e) => updateRoleMutation.mutate({ id: u.id, role: e.target.value })}
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
              <td className="cell">
                <StatusBadge
                  status={u.is_active ? 'ok' : 'retired'}
                  label={u.is_active ? 'Active' : 'Inactive'}
                />
              </td>
              <td className="cell text-ink-secondary">
                {new Date(u.created_at).toLocaleDateString()}
              </td>
              <td className="cell">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => onEdit(u)} className="btn-xs">
                    Edit
                  </button>
                  {u.id !== currentUser?.id && (
                    <>
                      <button onClick={() => onResetPassword(u)} className="btn-xs">
                        Reset Password
                      </button>
                      {u.role !== 'admin' &&
                        (u.is_active ? (
                          <button onClick={() => onDeactivate(u)} className="btn-xs-danger">
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => reactivateMutation.mutate(u.id)}
                            className="btn-xs"
                          >
                            Reactivate
                          </button>
                        ))}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 pb-4">
        <Pagination page={page} totalItems={users.length} onPageChange={onPageChange} />
      </div>
    </div>
  )
}
