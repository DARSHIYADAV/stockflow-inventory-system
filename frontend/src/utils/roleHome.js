export function getHomePath(role) {
  return role === 'employee' ? '/my-assets' : '/dashboard'
}
