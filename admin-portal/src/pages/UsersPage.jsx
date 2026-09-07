import { useCallback, useEffect, useState } from 'react'
import { createDepartment, listDepartments } from '../api/departments.js'
import { createAdminUser, listUsers, updateUserDepartment, updateUserRole } from '../api/users.js'

const ROLES = [
  { value: 'uploader', label: 'Uploader' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'super_admin', label: 'Super Admin' },
]

export function UsersPage() {
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('uploader')
  const [departmentId, setDepartmentId] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const [newDepartmentName, setNewDepartmentName] = useState('')

  const refresh = useCallback(async () => {
    try {
      const [usersResult, departmentsResult] = await Promise.all([
        listUsers(),
        listDepartments(),
      ])
      setUsers(usersResult.users)
      setDepartments(departmentsResult.departments)
      setError('')
    } catch (fetchError) {
      setError(fetchError.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleCreateUser(event) {
    event.preventDefault()
    setIsCreating(true)
    setError('')

    try {
      await createAdminUser({
        email,
        password,
        role,
        departmentId: role === 'super_admin' ? undefined : departmentId || undefined,
      })
      setEmail('')
      setPassword('')
      setRole('uploader')
      setDepartmentId('')
      await refresh()
    } catch (createError) {
      setError(createError.message)
    } finally {
      setIsCreating(false)
    }
  }

  async function handleRoleChange(userId, nextRole) {
    try {
      await updateUserRole(userId, nextRole)
      await refresh()
    } catch (updateError) {
      setError(updateError.message)
    }
  }

  async function handleDepartmentChange(userId, nextDepartmentId) {
    try {
      await updateUserDepartment(userId, nextDepartmentId || null)
      await refresh()
    } catch (updateError) {
      setError(updateError.message)
    }
  }

  async function handleCreateDepartment(event) {
    event.preventDefault()

    if (!newDepartmentName.trim()) {
      return
    }

    try {
      await createDepartment(newDepartmentName.trim())
      setNewDepartmentName('')
      await refresh()
    } catch (createError) {
      setError(createError.message)
    }
  }

  return (
    <div className="page">
      <h1>Staff access</h1>
      <p className="page-subtitle">
        <strong>Uploader</strong> can submit documents for their department only.{' '}
        <strong>Reviewer</strong> can also approve, replace, archive, and manage
        everything their department has uploaded. <strong>Super Admin</strong> sees
        every department and manages staff access.
      </p>

      {error && <p className="page-error">{error}</p>}

      <h3>Create an admin account</h3>
      <form className="upload-form" onSubmit={handleCreateUser}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Temporary password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          {ROLES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {role !== 'super_admin' && (
          <select
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
            required
          >
            <option value="" disabled>
              Select department
            </option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        )}
        <button type="submit" disabled={isCreating}>
          {isCreating ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <form className="upload-form" onSubmit={handleCreateDepartment}>
        <input
          type="text"
          placeholder="New department name"
          value={newDepartmentName}
          onChange={(event) => setNewDepartmentName(event.target.value)}
        />
        <button type="submit">Add department</button>
      </form>

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(event) => handleRoleChange(user.id, event.target.value)}
                    >
                      {ROLES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {user.role === 'super_admin' ? (
                      <span className="perm-note">all departments</span>
                    ) : (
                      <select
                        value={user.department_id || ''}
                        onChange={(event) =>
                          handleDepartmentChange(user.id, event.target.value)
                        }
                      >
                        <option value="" disabled>
                          Select department
                        </option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
