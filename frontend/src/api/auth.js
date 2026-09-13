import client from './client'

export async function login(email, password, role) {
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  const path = role ? `/auth/login/${role}` : '/auth/login'
  const { data } = await client.post(path, form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data
}

export async function getCurrentUser() {
  const { data } = await client.get('/auth/me')
  return data
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await client.put('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  })
  return data
}
