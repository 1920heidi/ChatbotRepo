import { randomUUID } from 'node:crypto'
import { query } from './db.js'

export async function listDepartments() {
  const result = await query(
    'SELECT id, name, created_at FROM departments ORDER BY name ASC',
  )
  return result.rows
}

export async function createDepartment(name) {
  const result = await query(
    `INSERT INTO departments (id, name)
     VALUES ($1, $2)
     ON CONFLICT (name) DO NOTHING
     RETURNING id, name, created_at`,
    [randomUUID(), name],
  )
  return result.rows[0] || null
}

export async function getDepartment(id) {
  const result = await query('SELECT * FROM departments WHERE id = $1', [id])
  return result.rows[0] || null
}
