/**
 * src/pages/Login.jsx  —  Updated to handle EMAIL_NOT_VERIFIED from backend
 */

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authResendVerification } from '../services/auth'

function Field({ label, id, type = 'text', value, onChange, placeholder, error, autoComplete, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-bold tracking-widest uppercase text-gray-400">{label}</label>
        {children}
      </div>
      <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete}
        className={`w-full bg-white/[0.04] border rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 outline-none transition-all duration-200 focus:bg-white/[0.07]
          ${error ? 'border-red-500/60 focus:border-red-400 focus:ring-1 focus:ring-red-400/20' : 'border-white/10 focus:border-brand-cyan/60 focus:ring-1 focus:ring-brand-cyan/10'}`} />
      {error && <p className="flex items-center gap-1.5 text-red-400 text-xs"><span>⚠</span>{error}</p>}
    </div>
  )
}

// ── Unverified email banner with resend ────────────────────────────────────
function UnverifiedBanner({ email, onResent }) {
  const [loading,  setLoading]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [error,    setError]    = useState('')
  const [cooldown, setCooldown] = useState(0)

  const handleResend = async () => {
    setLoading(true)
    setError('')
    try {
      await authResendVerification(email)
      setSent(true)
      setCooldown(120)
      onResent?.()
    } catch (err) {
      const msg = err.message || ''
      const match = msg.match(/(\d+) seconds/)
      if (match) {
        setCooldown(parseInt(match[1]))
      }
      setError(msg || 'Could not resend. Try again shortly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-orange-500/[0.08] border border-orange-500/25 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="text-orange-400 text-lg flex-shrink-0">📧</span>
        <div>
          <p className="text-orange-300 text-sm font-bold mb-0.5">Email not verified</p>
          <p className="text-orange-400/80 text-xs leading-relaxed">
            Please check your inbox and click the verification link before signing in.
          </p>
        </div>
      </div>

      {sent ? (
        <p className="text-emerald-400 text-xs flex items-center gap-1.5">
          <span>✓</span> New verification email sent! Check your inbox.
        </p>
      ) : (
        <>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={handleResend} disabled={loading || cooldown > 0}
            className="self-start text-xs font-bold text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email →'}
          </button>
        </>
      )}
    </div>
  )
}

export default function Login() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { login }  = useAuth()
  const returnTo   = location.state?.from || '/dashboard'

  // Show a success notice if coming from signup
  const justRegistered = location.state?.registered

  const [form,         setForm]         = useState({ email: '', password: '' })
  const [errors,       setErrors]       = useState({})
  const [apiError,     setApiError]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [showPass,     setShowPass]     = useState(false)
  const [unverified,   setUnverified]   = useState(false)   // EMAIL_NOT_VERIFIED state

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((er) => ({ ...er, [field]: '' }))
    setApiError('')
    setUnverified(false)
  }

  const validate = () => {
    const errs = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email    = 'Enter a valid email address.'
    if (!form.password)                                   errs.password  = 'Password is required.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setApiError('')
    setUnverified(false)

    try {
      await login({ email: form.email.trim().toLowerCase(), password: form.password })
      navigate(returnTo, { replace: true })
    } catch (err) {
      // Backend returns detail: "EMAIL_NOT_VERIFIED" → show inline banner
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        setUnverified(true)
      } else {
        setApiError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-brand-cyan/[0.05] blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-brand-purple/[0.05] blur-3xl pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,1) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,1) 1px,transparent 1px)', backgroundSize: '50px 50px' }} />

      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-brand-cyan flex items-center justify-center text-black font-black text-sm shadow-[0_0_16px_rgba(34,211,238,0.4)]">CF</div>
          <span className="font-black text-white text-lg tracking-tight">
            Career<span className="text-brand-cyan">Forge</span>{' '}
            <span className="text-gray-500 font-semibold text-sm">Arena</span>
          </span>
        </Link>

        <div className="bg-brand-card border border-white/[0.08] rounded-2xl p-8 shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-7">
            <h1 className="text-2xl font-black text-white tracking-tight mb-1.5">Welcome back</h1>
            <p className="text-gray-500 text-sm">Sign in to continue your journey.</p>
          </div>

          {/* Just-registered notice */}
          {justRegistered && !unverified && (
            <div className="flex items-start gap-3 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl px-4 py-3 mb-5">
              <span className="text-emerald-400 text-base flex-shrink-0">📧</span>
              <p className="text-emerald-400 text-sm leading-relaxed">
                Account created! Check your inbox for the verification email before signing in.
              </p>
            </div>
          )}

          {/* Generic API error */}
          {apiError && !unverified && (
            <div className="flex items-start gap-3 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 mb-5">
              <span className="text-red-400 flex-shrink-0">⚠</span>
              <p className="text-red-400 text-sm leading-relaxed">{apiError}</p>
            </div>
          )}

          {/* Unverified email banner */}
          {unverified && (
            <div className="mb-5">
              <UnverifiedBanner email={form.email} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <Field label="Email Address" id="email" type="email" value={form.email} onChange={set('email')}
              placeholder="ada@lovelace.dev" error={errors.email} autoComplete="email" />

            <Field label="Password" id="password" type={showPass ? 'text' : 'password'}
              value={form.password} onChange={set('password')} placeholder="Your password"
              error={errors.password} autoComplete="current-password">
              <a href="#" className="text-xs text-gray-500 hover:text-brand-cyan transition-colors duration-200">
                Forgot password?
              </a>
            </Field>

            <label className="flex items-center gap-2.5 cursor-pointer select-none -mt-2">
              <input type="checkbox" checked={showPass} onChange={() => setShowPass(!showPass)} className="accent-brand-cyan w-3.5 h-3.5" />
              <span className="text-gray-400 text-xs">Show password</span>
            </label>

            <button type="submit" disabled={loading}
              className="w-full mt-1 flex items-center justify-center gap-2 py-3.5 px-8 rounded-lg bg-brand-cyan text-black font-black text-sm tracking-widest uppercase border border-brand-cyan transition-all duration-300 hover:bg-transparent hover:text-brand-cyan hover:shadow-[0_0_24px_rgba(34,211,238,0.45)] disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Signing in…</>
              ) : 'Sign In →'}
            </button>

            <p className="text-center text-gray-500 text-sm pt-1">
              New to CareerForge?{' '}
              <Link to="/signup" className="text-brand-cyan hover:text-cyan-300 font-bold transition-colors duration-200">
                Create account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}