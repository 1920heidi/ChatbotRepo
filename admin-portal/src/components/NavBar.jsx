import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  reviewer: 'Reviewer',
  uploader: 'Uploader',
}

export function NavBar() {
  const { admin, logout } = useAuth()
  const canReview = admin?.role === 'reviewer' || admin?.role === 'super_admin'
  const isSuperAdmin = admin?.role === 'super_admin'

  return (
    <header className="nav-bar">
      <div className="nav-bar-brand">
        <img src="/psclogo.png" alt="" className="nav-bar-logo" />
        <span>PSC Admin Portal</span>
      </div>

      <nav className="nav-bar-links">
        <NavLink to="/documents" className={({ isActive }) => (isActive ? 'active' : '')}>
          Documents
        </NavLink>
        {canReview && (
          <NavLink to="/documents/archived" className={({ isActive }) => (isActive ? 'active' : '')}>
            Archived
          </NavLink>
        )}
        {canReview && (
          <NavLink to="/conversations" className={({ isActive }) => (isActive ? 'active' : '')}>
            Conversations
          </NavLink>
        )}
        {isSuperAdmin && (
          <NavLink to="/users" className={({ isActive }) => (isActive ? 'active' : '')}>
            Users
          </NavLink>
        )}
      </nav>

      <div className="nav-bar-account">
        {admin && (
          <span className="nav-bar-email">
            {admin.email}
            <span className="nav-bar-role">{ROLE_LABELS[admin.role] || admin.role}</span>
          </span>
        )}
        <button type="button" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  )
}
