/**
 * src/services/api.js
 * Centralised Axios instance + all API calls used by the app.
 */

import axios from 'axios'

// ── Base instance ──────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

// ── Request interceptor: attach JWT if present ─────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cf_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: surface clean error messages ────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.detail ||
      error?.message ||
      'Something went wrong. Please try again.'
    return Promise.reject(new Error(message))
  }
)

// ── Auth endpoints ─────────────────────────────────────────────────────────
export const apiSignup = async ({ name, email, password }) => {
  const { data } = await api.post('/auth/signup', { name, email, password })
  return data
}

export const apiLogin = async ({ email, password }) => {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export const apiGetMe = async () => {
  const { data } = await api.get('/auth/me')
  return data
}

export default api