import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function ProtectedRoute({ children, roles }) {
  const { token, admin } = useAuth()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (roles && (!admin || !roles.includes(admin.role))) {
    return <Navigate to="/documents" replace />
  }

  return children
}
