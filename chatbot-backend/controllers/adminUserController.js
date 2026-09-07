import { query } from '../services/db.js'

const VALID_ROLES = ['super_admin', 'reviewer', 'uploader']

export async function list(request, response) {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.role, u.department_id, u.created_at, dep.name AS department_name
       FROM admin_users u
       LEFT JOIN departments dep ON dep.id = u.department_id
       ORDER BY u.created_at ASC`,
    )

    return response.json({ users: result.rows })
  } catch (error) {
    console.error('Listing admin users failed:', error)

    return response.status(500).json({ error: 'Could not list admin users.' })
  }
}

export async function updateRole(request, response) {
  try {
    const { role } = request.body

    if (!VALID_ROLES.includes(role)) {
      return response.status(400).json({
        error: `role must be one of: ${VALID_ROLES.join(', ')}.`,
      })
    }

    const target = await query('SELECT id, role FROM admin_users WHERE id = $1', [
      request.params.id,
    ])

    if (!target.rows[0]) {
      return response.status(404).json({ error: 'Admin account not found.' })
    }

    if (target.rows[0].role === 'super_admin' && role !== 'super_admin') {
      const superAdminCount = await query(
        `SELECT count(*) FROM admin_users WHERE role = 'super_admin'`,
      )

      if (Number(superAdminCount.rows[0].count) <= 1) {
        return response.status(400).json({
          error: 'At least one Super Admin account must remain.',
        })
      }
    }

    await query('UPDATE admin_users SET role = $1 WHERE id = $2', [
      role,
      request.params.id,
    ])

    return response.json({ id: request.params.id, role })
  } catch (error) {
    console.error('Updating admin role failed:', error)

    return response.status(500).json({ error: 'Could not update the role.' })
  }
}

export async function updateDepartment(request, response) {
  try {
    const { department_id: departmentId } = request.body

    const result = await query(
      'UPDATE admin_users SET department_id = $1 WHERE id = $2 RETURNING id',
      [departmentId || null, request.params.id],
    )

    if (!result.rows[0]) {
      return response.status(404).json({ error: 'Admin account not found.' })
    }

    return response.json({ id: request.params.id, department_id: departmentId || null })
  } catch (error) {
    console.error('Updating admin department failed:', error)

    return response.status(500).json({ error: 'Could not update the department.' })
  }
}
