/**
 * src/pages/VerifyEmail.jsx
 * Route: /verify-email/:token
 *
 * Called automatically when user clicks the link in their Gmail.
 * Extracts token from URL → calls GET /auth/verify-email/:token
 *
 * States:
 *   verifying  — spinner (initial API call in progress)
 *   success    — green, with "Go to Login" CTA
 *   expired    — orange, with resend option
 *   invalid    — red, link already used or malformed
 *   resending  — spinner after clicking "Resend"
 *   resent     — success state after resend
 */

import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { authResendVerification, authVerifyEmail } from '../services/auth'

// ── Countdown hook ─────────────────────────────────────────────────────────
function useCountdown(seconds) {
  const [remaining, setRemaining] = useState(seconds)
  useEffect(() => {
    if (remaining <= 0) return
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(id)
  }, [remaining])
  return remaining
}

// ── State card configurations ──────────────────────────────────────────────
const STATES = {
  verifying: {
    icon:    null,   // spinner
    color:   'cyan',
    heading: 'Verifying your email…',
    body:    'Hang tight — we\'re confirming your address.',
  },
  success: {
    icon:    '🎉',
    color:   'green',
    heading: 'Email verified!',
    body:    'Your CareerForge Arena account is now active. Start levelling up!',
  },
  already_verified: {
    icon:    '✅',
    color:   'green',
    heading: 'Already verified',
    body:    'This email address has already been verified. You can sign in.',
  },
  expired: {
    icon:    '⏰',
    color:   'orange',
    heading: 'Link expired',
    body:    'This verification link has expired. Request a new one below.',
  },
  invalid: {
    icon:    '❌',
    color:   'red',
    heading: 'Invalid link',
    body:    'This link is invalid or has already been used. If you need a new one, enter your email below.',
  },
  resent: {
    icon:    '📧',
    color:   'cyan',
    heading: 'New link sent!',
    body:    'A fresh verification email is on its way. Check your inbox.',
  },
}

const ACCENT = {
  cyan:   { border: 'border-brand-cyan/25',   icon_bg: 'bg-brand-cyan/10',   text: 'text-brand-cyan',   btn: 'bg-brand-cyan text-black border-brand-cyan hover:bg-transparent hover:text-brand-cyan' },
  green:  { border: 'border-emerald-500/25',  icon_bg: 'bg-emerald-500/10',  text: 'text-emerald-400',  btn: 'bg-emerald-500 text-black border-emerald-500 hover:bg-transparent hover:text-emerald-400' },
  orange: { border: 'border-orange-500/25',   icon_bg: 'bg-orange-500/10',   text: 'text-orange-400',   btn: 'bg-orange-500 text-black border-orange-500 hover:bg-transparent hover:text-orange-400' },
  red:    { border: 'border-red-500/25',      icon_bg: 'bg-red-500/10',      text: 'text-red-400',      btn: 'bg-red-500 text-black border-red-500 hover:bg-transparent hover:text-red-400' },
}

// ── Resend form ────────────────────────────────────────────────────────────
function ResendForm({ onSuccess }) {
  const [email,     setEmail]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [cooldown,  setCooldown]  = useState(0)
  const countdown = useCountdown(cooldown)

  const handleResend = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authResendVerification(email)
      setCooldown(120)
      onSuccess()
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('already verified')) {
        setError('That email is already verified. You can sign in.')
      } else if (msg.includes('wait')) {
        // Extract seconds from error message
        const match = msg.match(/(\d+) seconds/)
        setCooldown(match ? parseInt(match[1]) : 120)
        setError(msg)
      } else {
        setError(msg || 'Failed to resend. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 mt-6 w-full">
      <input
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setError('') }}
        placeholder="Enter your email address"
        className="w-full bg-white/[0.04] border border-white/10 focus:border-brand-cyan/60 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 outline-none transition-all duration-200 focus:bg-white/[0.07] focus:ring-1 focus:ring-brand-cyan/10"
      />
      {error && <p className="text-red-400 text-xs flex items-center gap-1.5"><span>⚠</span>{error}</p>}

      {countdown > 0 ? (
        <div className="flex items-center justify-center gap-2 py-3 text-gray-500 text-sm">
          <span className="w-4 h-4 rounded-full border-2 border-gray-600 border-t-brand-cyan animate-spin" />
          Resend available in {countdown}s
        </div>
      ) : (
        <button onClick={handleResend} disabled={loading}
          className="flex items-center justify-center gap-2 py-3 px-6 rounded-lg border border-brand-cyan bg-transparent
            text-brand-cyan font-bold text-sm tracking-widest uppercase transition-all duration-300
            hover:bg-brand-cyan hover:text-black hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]
            disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? (
            <><span className="w-4 h-4 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />Sending…</>
          ) : '📧 Resend Verification Email'}
        </button>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function VerifyEmail() {
  const { token }  = useParams()
  const [state,    setState]    = useState('verifying')
  const [apiError, setApiError] = useState('')
  const calledRef  = useRef(false)

  useEffect(() => {
    if (calledRef.current) return   // prevent double-fire in Strict Mode
    calledRef.current = true

    if (!token) {
      setState('invalid')
      return
    }

    const verify = async () => {
      try {
        await authVerifyEmail(token)
        setState('success')
      } catch (err) {
        const msg = err.message || ''
        if (msg.toLowerCase().includes('expired')) {
          setState('expired')
        } else if (msg.toLowerCase().includes('already')) {
          setState('already_verified')
        } else {
          setState('invalid')
          setApiError(msg)
        }
      }
    }

    verify()
  }, [token])

  const handleResendSuccess = () => setState('resent')

  const cfg    = STATES[state] || STATES.invalid
  const accent = ACCENT[cfg.color] || ACCENT.cyan
  const showResend = state === 'expired' || state === 'invalid'

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-brand-cyan/[0.04] blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-brand-purple/[0.04] blur-3xl pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,1) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,1) 1px,transparent 1px)', backgroundSize: '50px 50px' }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-brand-cyan flex items-center justify-center text-black font-black text-sm shadow-[0_0_16px_rgba(34,211,238,0.4)]">CF</div>
          <span className="font-black text-white text-lg tracking-tight">
            Career<span className="text-brand-cyan">Forge</span>{' '}
            <span className="text-gray-500 font-semibold text-sm">Arena</span>
          </span>
        </Link>

        {/* Card */}
        <div className={`bg-brand-card border ${accent.border} rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.5)]`}>
          {/* Top accent bar */}
          <div className={`h-1 w-full bg-gradient-to-r ${
            cfg.color === 'green'  ? 'from-emerald-400 to-brand-cyan' :
            cfg.color === 'orange' ? 'from-orange-400 to-yellow-400' :
            cfg.color === 'red'    ? 'from-red-500 to-orange-400'    :
                                     'from-brand-cyan to-brand-purple'
          }`} />

          <div className="p-8 flex flex-col items-center gap-5 text-center">
            {/* Icon / Spinner */}
            {state === 'verifying' ? (
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-brand-cyan/15" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-cyan animate-spin" />
                <span className="text-2xl">🔐</span>
              </div>
            ) : (
              <div className={`w-20 h-20 rounded-full ${accent.icon_bg} flex items-center justify-center text-4xl border border-white/5`}>
                {cfg.icon}
              </div>
            )}

            {/* Heading */}
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">{cfg.heading}</h1>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">{cfg.body}</p>
              {apiError && <p className="text-red-400 text-xs mt-1">{apiError}</p>}
            </div>

            {/* CTAs */}
            {(state === 'success' || state === 'already_verified') && (
              <div className="flex flex-col gap-3 w-full mt-2">
                <Link to="/login"
                  className={`flex items-center justify-center py-3.5 px-8 rounded-lg border font-black text-sm tracking-widest uppercase transition-all duration-300 ${accent.btn}`}>
                  Sign In to Your Account →
                </Link>
                <Link to="/" className="text-gray-500 text-sm hover:text-gray-300 transition-colors duration-200">
                  ← Back to home
                </Link>
              </div>
            )}

            {state === 'resent' && (
              <div className="flex flex-col gap-3 w-full mt-2">
                <div className="flex items-center gap-2 justify-center text-sm text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
                  Check your inbox — the link expires in 24 hours.
                </div>
                <Link to="/login" className="text-brand-cyan text-sm hover:text-cyan-300 transition-colors duration-200">
                  Already verified? Sign in →
                </Link>
              </div>
            )}

            {/* Resend form */}
            {showResend && <ResendForm onSuccess={handleResendSuccess} />}

            {/* Back link for non-resend states */}
            {!showResend && state !== 'success' && state !== 'already_verified' && state !== 'resent' && (
              <Link to="/" className="text-gray-600 text-xs hover:text-gray-400 transition-colors duration-200 mt-2">
                ← Back to home
              </Link>
            )}
          </div>
        </div>

        {/* Help text */}
        <p className="text-center text-gray-600 text-xs mt-6 leading-relaxed">
          Having trouble? Contact us at{' '}
          <a href="mailto:support@careerforge.dev" className="text-gray-500 hover:text-gray-300 transition-colors duration-200">
            support@careerforge.dev
          </a>
        </p>
      </div>
    </div>
  )
}
