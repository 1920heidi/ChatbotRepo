import { verifyToken } from '../services/authService.js'

export function requireAdmin(request, response, next) {
  const header = request.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return response.status(401).json({ error: 'Authentication required.' })
  }

  try {
    request.admin = verifyToken(token)
    return next()
  } catch (error) {
    return response.status(401).json({ error: 'Invalid or expired session.' })
  }
}

export function requireRole(...roles) {
  return (request, response, next) => {
    if (!request.admin || !roles.includes(request.admin.role)) {
      return response.status(403).json({
        error: 'You do not have permission to do that.',
      })
    }

    return next()
  }
}
