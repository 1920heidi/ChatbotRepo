import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../config/config.js'

const SALT_ROUNDS = 12

export function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export function signToken(admin) {
  return jwt.sign(
    {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      department_id: admin.department_id,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  )
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret)
}
