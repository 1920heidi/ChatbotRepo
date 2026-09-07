import { randomUUID } from 'node:crypto'
import { query } from '../services/db.js'
import { comparePassword, hashPassword, signToken } from '../services/authService.js'

const VALID_ROLES = ['super_admin', 'reviewer', 'uploader']

export async function login(request, response) {
  try {
    const { email, password } = request.body

    if (typeof email !== 'string' || typeof password !== 'string') {
      return response.status(400).json({
        error: 'Email and password are required.',
      })
    }

    const result = await query(
      `SELECT id, email, password_hash, role, department_id
       FROM admin_users WHERE email = $1`,
      [email.trim().toLowerCase()],
    )
    const admin = result.rows[0]

    if (!admin || !(await comparePassword(password, admin.password_hash))) {
      return response.status(401).json({ error: 'Invalid email or password.' })
    }

    const token = signToken(admin)

    return response.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        department_id: admin.department_id,
      },
    })
  } catch (error) {
    console.error('Admin login failed:', error)

    return response.status(500).json({ error: 'Login failed.' })
  }
}

export async function createAdmin(request, response) {
  try {
    const { email, password, role = 'uploader', department_id: departmentId } =
      request.body

    if (typeof email !== 'string' || typeof password !== 'string' || password.length < 8) {
      return response.status(400).json({
        error: 'A valid email and a password of at least 8 characters are required.',
      })
    }

    if (!VALID_ROLES.includes(role)) {
      return response.status(400).json({
        error: `role must be one of: ${VALID_ROLES.join(', ')}.`,
      })
    }

    if (role !== 'super_admin' && !departmentId) {
      return response.status(400).json({
        error: 'A department is required for Reviewer and Uploader accounts.',
      })
    }

    const passwordHash = await hashPassword(password)

    const result = await query(
      `INSERT INTO admin_users (id, email, password_hash, role, department_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, role, department_id`,
      [
        randomUUID(),
        email.trim().toLowerCase(),
        passwordHash,
        role,
        role === 'super_admin' ? null : departmentId,
      ],
    )

    if (!result.rows[0]) {
      return response.status(409).json({ error: 'An admin with that email already exists.' })
    }

    return response.status(201).json({ admin: result.rows[0] })
  } catch (error) {
    console.error('Admin creation failed:', error)

    return response.status(500).json({ error: 'Could not create admin account.' })
  }
}
