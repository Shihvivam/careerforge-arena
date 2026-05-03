import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

// Layout
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'

// Landing sections
import HeroSection     from './components/landing/HeroSection'
import FeaturesSection from './components/landing/FeaturesSection'
import HowItWorks      from './components/landing/HowItWorks'
import CTASection      from './components/landing/CTASection'

// Pages
import Login     from './pages/Login'
import Signup    from './pages/Signup'
import Dashboard from './pages/Dashboard'

// ── Protected route wrapper ────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  return user ? children : <Navigate to="/login" replace />
}

// ── Public route wrapper (redirect to dashboard if already logged in) ──────
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  return !user ? children : <Navigate to="/dashboard" replace />
}

const FullScreenSpinner = () => (
  <div className="min-h-screen bg-brand-bg flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
      <span className="text-gray-500 text-sm tracking-widest uppercase">Loading…</span>
    </div>
  </div>
)

// ── Landing page (composed of sections) ───────────────────────────────────
const LandingPage = () => (
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

// ── App ───────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/"          element={<LandingPage />} />
      <Route path="/login"     element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup"    element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      {/* Catch-all */}
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  )
}
