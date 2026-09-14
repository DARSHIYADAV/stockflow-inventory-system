import client from './client'

export async function listUsers() {
  const { data } = await client.get('/users')
  return data
}

export async function listAssignableUsers() {
  const { data } = await client.get('/users/assignable')
  return data
}

export async function updateUserRole(userId, role) {
  const { data } = await client.put(`/users/${userId}/role`, { role })
  return data
}

export async function createManagedUser(payload) {
  const { data } = await client.post('/users', payload)
  return data
}

export async function updateManagedUser(userId, payload) {
  const { data } = await client.put(`/users/${userId}`, payload)
  return data
}

export async function resetUserPassword(userId, newPassword) {
  const { data } = await client.put(`/users/${userId}/reset-password`, { new_password: newPassword })
  return data
}

export async function deactivateUser(userId) {
  const { data } = await client.put(`/users/${userId}/deactivate`)
  return data
}

export async function reactivateUser(userId) {
  const { data } = await client.put(`/users/${userId}/reactivate`)
  return data
}
