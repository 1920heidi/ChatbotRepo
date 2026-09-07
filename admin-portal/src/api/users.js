import { adminFetch } from './client.js'

export function listUsers() {
  return adminFetch('/api/admin/users')
}

export function createAdminUser({ email, password, role, departmentId }) {
  return adminFetch('/api/admin/auth/admins', {
    method: 'POST',
    body: JSON.stringify({ email, password, role, department_id: departmentId }),
  })
}

export function updateUserRole(id, role) {
  return adminFetch(`/api/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}

export function updateUserDepartment(id, departmentId) {
  return adminFetch(`/api/admin/users/${id}/department`, {
    method: 'PATCH',
    body: JSON.stringify({ department_id: departmentId }),
  })
}
