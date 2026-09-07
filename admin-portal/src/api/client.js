const API_BASE_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:3001'
const TOKEN_KEY = 'psc_admin_token'
const ADMIN_KEY = 'psc_admin_profile'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getStoredAdmin() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredAdmin(admin) {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
}

export function clearStoredAdmin() {
  localStorage.removeItem(ADMIN_KEY)
}

export async function adminFetch(path, options = {}) {
  const token = getToken()

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401) {
    clearToken()
    clearStoredAdmin()
    window.location.href = '/login'
    throw new Error('Session expired. Please log in again.')
  }

  if (!response.ok) {
    const details = await response.text()
    throw new Error(details || `Request to ${path} failed.`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const details = await response.json().catch(() => ({}))
    throw new Error(details.error || 'Login failed.')
  }

  return response.json()
}
