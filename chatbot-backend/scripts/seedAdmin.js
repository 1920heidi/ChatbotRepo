import { randomUUID } from 'node:crypto'
import { query } from '../services/db.js'
import { hashPassword } from '../services/authService.js'

const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD

if (!email || !password) {
  console.error(
    'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set to seed the first admin account.',
  )
  process.exit(1)
}

const existing = await query('SELECT id FROM admin_users WHERE email = $1', [
  email.trim().toLowerCase(),
])

if (existing.rows[0]) {
  console.log(`Admin account for ${email} already exists. Nothing to do.`)
  process.exit(0)
}

const passwordHash = await hashPassword(password)

await query(
  `INSERT INTO admin_users (id, email, password_hash, role)
   VALUES ($1, $2, $3, 'super_admin')`,
  [randomUUID(), email.trim().toLowerCase(), passwordHash],
)

console.log(`Admin account created for ${email}.`)
process.exit(0)
