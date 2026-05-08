/**
 * src/components/PublicRoute.jsx
 *
 * Route guard for public-only pages (login, signup).
 * If the user is already authenticated, redirect to /dashboard
 * so they never see the login page again after signing in.
 *
 * Usage:
 *   <Route path="/login" element={
 *     <PublicRoute><Login /></PublicRoute>
 *   } />
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function FullScreenSpinner() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-brand-cyan animate-spin" />
    </div>
  )
}

export default function PublicRoute({ children, redirectTo = '/dashboard' }) {
  const { isLoading, isAuthenticated } = useAuth()

  if (isLoading)       return <FullScreenSpinner />
  if (isAuthenticated) return <Navigate to={redirectTo} replace />

  return children
}
