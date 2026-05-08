/**
 * src/App.jsx  —  Updated router with /verify-email/:token route
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute    from './components/PublicRoute'

import Navbar         from './components/layout/Navbar'
import Footer         from './components/layout/Footer'
import HeroSection    from './components/landing/HeroSection'
import FeaturesSection from './components/landing/FeaturesSection'
import HowItWorks     from './components/landing/HowItWorks'
import CTASection     from './components/landing/CTASection'

import Login       from './pages/Login'
import Signup      from './pages/Signup'
import Dashboard   from './pages/Dashboard'
import VerifyEmail from './pages/VerifyEmail'

function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-white font-sans antialiased">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/"          element={<LandingPage />} />

      {/* Public routes — redirect to /dashboard if already authenticated */}
      <Route path="/login"     element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup"    element={<PublicRoute><Signup /></PublicRoute>} />

      {/* Email verification — accessible without auth (token IS the auth) */}
      <Route path="/verify-email/:token" element={<VerifyEmail />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
