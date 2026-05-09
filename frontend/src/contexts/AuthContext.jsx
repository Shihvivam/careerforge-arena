/**
 * src/contexts/AuthContext.jsx
 *
 * Global authentication state for the entire app.
 *
 * STATE:
 *   user       — UserPublic object or null
 *   token      — JWT string or null
 *   status     — "loading" | "authenticated" | "unauthenticated"
 *
 * SESSION PERSISTENCE:
 *   On every mount, if a token exists in localStorage:
 *     1. Set status = "loading"
 *     2. Call GET /auth/me to validate the token server-side
 *     3. If valid → restore user session
 *     4. If invalid/expired → clear token, set unauthenticated
 *
 * This guarantees the dashboard survives page refresh AND
 * that a tampered/expired token is rejected on next load.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  authGetMe,
  authLogin,
  authLogout,
  authSignup,
  getToken,
  removeToken,
  setToken,
} from '../services/auth'

// ── Context creation ───────────────────────────────────────────────────────
const AuthContext = createContext(null)

// ── Provider ───────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,   setUser]   = useState(null)
  const [token,  setTokenState] = useState(null)
  const [status, setStatus] = useState('loading')  // start loading until hydration done

  // Prevent double-hydration in React Strict Mode
  const hydratedRef = useRef(false)

  // ── Session hydration on mount ─────────────────────────────────────────
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true

    const hydrate = async () => {
      const storedToken = getToken()

      if (!storedToken) {
        setStatus('unauthenticated')
        return
      }

      try {
        // Validate token server-side — this is the key fix for refresh breaks
        const me = await authGetMe()
        setUser(me)
        setTokenState(storedToken)
        setStatus('authenticated')
      } catch {
        // Token is expired, tampered, or user no longer exists
        removeToken()
        setUser(null)
        setTokenState(null)
        setStatus('unauthenticated')
      }
    }

    hydrate()
  }, [])

  // ── signup ─────────────────────────────────────────────────────────────
  const signup = useCallback(async ({ name, email, password }) => {
    // Returns UserPublic — caller should redirect to /login
    return await authSignup({ name, email, password })
  }, [])

  // ── login ──────────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    const { access_token, user: me } = await authLogin({ email, password })

    setToken(access_token)      // persist to localStorage
    setTokenState(access_token) // update state
    setUser(me)
    setStatus('authenticated')

    return me
  }, [])

  // ── logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authLogout()   // notify server (fire-and-forget)
    removeToken()        // clear localStorage
    setTokenState(null)
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  // ── refreshUser ────────────────────────────────────────────────────────
  // Call after XP/level changes to sync dashboard state
  const refreshUser = useCallback(async () => {
    try {
      const me = await authGetMe()
      setUser(me)
      return me
    } catch {
      await logout()
      return null
    }
  }, [logout])

  // ── Derived booleans ───────────────────────────────────────────────────
  const isLoading         = status === 'loading'
  const isAuthenticated   = status === 'authenticated' && user !== null
  const isUnauthenticated = status === 'unauthenticated'

  const value = {
    user,
    token,
    status,
    isLoading,
    isAuthenticated,
    isUnauthenticated,
    signup,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth() must be called inside <AuthProvider>.')
  }
  return ctx
}