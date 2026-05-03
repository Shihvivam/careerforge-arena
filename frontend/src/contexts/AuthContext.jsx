/**
 * src/contexts/AuthContext.jsx
 * Global auth state: user, token, login, logout, loading.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiGetMe, apiLogin, apiSignup } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(() => localStorage.getItem('cf_token'))
  const [loading, setLoading] = useState(true)   // initial hydration
  const [error,   setError]   = useState(null)

  // ── Hydrate on mount if token exists ──────────────────────────────────
  useEffect(() => {
    const hydrate = async () => {
      if (!token) { setLoading(false); return }
      try {
        const me = await apiGetMe()
        setUser(me)
      } catch {
        // Token invalid / expired — clear everything
        localStorage.removeItem('cf_token')
        setToken(null)
      } finally {
        setLoading(false)
      }
    }
    hydrate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ────────────────────────────────────────────────────────────
  const persistToken = (t) => {
    localStorage.setItem('cf_token', t)
    setToken(t)
  }

  const signup = useCallback(async ({ name, email, password }) => {
    setError(null)
    await apiSignup({ name, email, password })
    // Don't auto-login — redirect to /login after signup
  }, [])

  const login = useCallback(async ({ email, password }) => {
    setError(null)
    const { access_token, user: me } = await apiLogin({ email, password })
    persistToken(access_token)
    setUser(me)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cf_token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, error, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
