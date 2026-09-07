import { createContext, useContext, useState } from 'react'
import {
  clearStoredAdmin,
  clearToken,
  getStoredAdmin,
  getToken,
  login as loginRequest,
  setStoredAdmin,
  setToken,
} from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken())
  const [admin, setAdmin] = useState(getStoredAdmin())

  async function login(email, password) {
    const result = await loginRequest(email, password)
    setToken(result.token)
    setStoredAdmin(result.admin)
    setTokenState(result.token)
    setAdmin(result.admin)
    return result.admin
  }

  function logout() {
    clearToken()
    clearStoredAdmin()
    setTokenState(null)
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ token, admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
