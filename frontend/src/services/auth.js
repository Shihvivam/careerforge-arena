/**
 * src/services/auth.js
 * All auth-related API calls.
 * Single Axios instance with request/response interceptors.
 *
 * TOKEN STORAGE KEY: "cf_token"
 * This is the single source of truth — never hardcode this string elsewhere.
 */

import axios from 'axios'

export const TOKEN_KEY = 'cf_token'

// ── Axios instance ─────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 12_000,
})

// ── Request interceptor: auto-attach stored JWT ────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: normalise error messages ─────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // FastAPI validation errors return an array of error objects
    const detail = err?.response?.data?.detail
    let message

    if (Array.isArray(detail)) {
      // Pydantic validation errors: [{loc, msg, type}, ...]
      message = detail.map((e) => e.msg).join(' ')
    } else if (typeof detail === 'string') {
      message = detail
    } else {
      message = err?.message || 'An unexpected error occurred.'
    }

    // Auto-clear token on 401 (expired/invalid)
    if (err?.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
    }

    return Promise.reject(new Error(message))
  }
)

// ── Token helpers ──────────────────────────────────────────────────────────
export const getToken    = ()      => localStorage.getItem(TOKEN_KEY)
export const setToken    = (token) => localStorage.setItem(TOKEN_KEY, token)
export const removeToken = ()      => localStorage.removeItem(TOKEN_KEY)

export const isTokenPresent = () => Boolean(localStorage.getItem(TOKEN_KEY))

// ── Auth API calls ─────────────────────────────────────────────────────────

/**
 * Register a new account.
 * @returns {Promise<UserPublic>}  (no token — redirect to login after)
 */
export const authSignup = async ({ name, email, password }) => {
  const { data } = await api.post('/auth/signup', { name, email, password })
  return data
}

/**
 * Login with email + password.
 * @returns {Promise<{ access_token, token_type, expires_in, user }>}
 */
export const authLogin = async ({ email, password }) => {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

/**
 * Fetch the currently authenticated user.
 * Requires a valid token in localStorage (attached by interceptor).
 * @returns {Promise<UserPublic>}
 */
export const authGetMe = async () => {
  const { data } = await api.get('/auth/me')
  return data
}

/**
 * Notify the server of logout (optional — real invalidation is client-side).
 */
export const authLogout = async () => {
  try {
    await api.post('/auth/logout')
  } catch {
    // Fire-and-forget — client clears token regardless
  }
}

export default api


// ── Email verification API calls ────────────────────────────────────────────

/**
 * Verify email using token from URL.
 * @param {string} token
 * @returns {Promise<{ message: string }>}
 */
export const authVerifyEmail = async (token) => {
  const { data } = await api.get(`/auth/verify-email/${token}`)
  return data
}

/**
 * Resend verification email to given address.
 * @param {string} email
 * @returns {Promise<{ message: string }>}
 */
export const authResendVerification = async (email) => {
  const { data } = await api.post('/auth/resend-verification', { email })
  return data
}


// ── Dev-only helpers ────────────────────────────────────────────────────────

/**
 * [DEV] Fetch SMTP config status from backend.
 * @returns {Promise<object>}
 */
export const authGetEmailConfig = async () => {
  const { data } = await api.get('/auth/email-config')
  return data
}

/**
 * [DEV] Send a test email to verify Gmail App Password works.
 * @param {string} toEmail
 * @returns {Promise<{ message: string }>}
 */
export const authTestEmail = async (toEmail) => {
  const { data } = await api.post('/auth/test-email', { to_email: toEmail })
  return data
}