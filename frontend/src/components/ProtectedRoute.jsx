/**
 * src/components/ProtectedRoute.jsx
 *
 * Route guard for authenticated-only pages.
 *
 * Behaviour:
 *   status === "loading"          → Show full-screen spinner (hydrating token)
 *   status === "authenticated"    → Render children
 *   status === "unauthenticated"  → Redirect to /login (with return URL)
 *
 * Usage:
 *   <Route path="/dashboard" element={
 *     <ProtectedRoute><Dashboard /></ProtectedRoute>
 *   } />
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function FullScreenSpinner() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center gap-5">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-14 h-14 rounded-full border-2 border-brand-cyan/20" />
        {/* Spinning arc */}
        <div className="absolute inset-0 w-14 h-14 rounded-full border-2 border-transparent border-t-brand-cyan animate-spin" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-white text-sm font-bold tracking-widest uppercase">Authenticating</span>
        <span className="text-gray-600 text-xs">Verifying your session…</span>
      </div>
    </div>
  )
}

export default function ProtectedRoute({ children, redirectTo = '/login' }) {
  const { isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Still hydrating — show spinner, don't flash login page
  if (isLoading) return <FullScreenSpinner />

  // Authenticated — render the protected content
  if (isAuthenticated) return children

  // Not authenticated — redirect to login, preserving the attempted URL
  return (
    <Navigate
      to={redirectTo}
      replace
      state={{ from: location.pathname }}
    />
  )
}
