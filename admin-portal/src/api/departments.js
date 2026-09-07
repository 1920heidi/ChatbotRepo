import { adminFetch } from './client.js'

export function listDepartments() {
  return adminFetch('/api/admin/departments')
}

export function createDepartment(name) {
  return adminFetch('/api/admin/departments', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}
