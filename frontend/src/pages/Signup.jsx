/**
 * src/pages/Signup.jsx  —  Updated to show "check your inbox" state after registration.
 * Redirects to /login with state.registered=true so Login shows the verification notice.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authResendVerification } from '../services/auth'

function StrengthBar({ password }) {
  const checks = [
    password.length >= 8,
    password.length >= 12,
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  if (!password) return null
  const colors = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400']
  const labels = ['', 'Very weak', 'Weak', 'Fair', 'Good', 'Strong']
  const lc     = score <= 2 ? 'text-red-400' : score <= 3 ? 'text-yellow-400' : 'text-green-400'
  return (
    <div className="flex flex-col gap-1.5 -mt-2">
      <div className="flex gap-1">
        {[1,2,3,4,5].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-white/10'}`} />
        ))}
      </div>
      <p className={`text-xs font-semibold ${lc}`}>{labels[score]}</p>
    </div>
  )
}

function Field({ label, id, type='text', value, onChange, placeholder, error, autoComplete }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-bold tracking-widest uppercase text-gray-400">{label}</label>
      <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete}
        className={`w-full bg-white/[0.04] border rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 outline-none transition-all duration-200 focus:bg-white/[0.07]
          ${error ? 'border-red-500/60 focus:border-red-400 focus:ring-1 focus:ring-red-400/20' : 'border-white/10 focus:border-brand-cyan/60 focus:ring-1 focus:ring-brand-cyan/10'}`} />
      {error && <p className="flex items-center gap-1.5 text-red-400 text-xs"><span>⚠</span>{error}</p>}
    </div>
  )
}

// ── "Check your inbox" state ───────────────────────────────────────────────
function CheckInboxState({ email, onGoToLogin }) {
  const [resending, setResending] = useState(false)
  const [resent,    setResent]    = useState(false)
  const [cooldown,  setCooldown]  = useState(0)
  const [error,     setError]     = useState('')

  const handleResend = async () => {
    setResending(true)
    setError('')
    try {
      await authResendVerification(email)
      setResent(true)
      setCooldown(120)
    } catch (err) {
      const msg   = err.message || ''
      const match = msg.match(/(\d+) seconds/)
      if (match) setCooldown(parseInt(match[1]))
      setError(msg || 'Could not resend. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="w-20 h-20 rounded-full bg-brand-cyan/10 border border-brand-cyan/25 flex items-center justify-center text-4xl">
        📧
      </div>

      <div className="text-center">
        <h2 className="text-xl font-black text-white mb-2 tracking-tight">Check your inbox!</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          We've sent a verification link to{' '}
          <span className="text-white font-semibold">{email}</span>.
          <br />Click it to activate your account.
        </p>
      </div>

      <div className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-4 flex flex-col gap-2 text-left">
        {[
          ['📬', 'Check your inbox (and spam folder)'],
          ['⏰', 'Link expires in 24 hours'],
          ['🔄', 'Didn\'t get it? Request a new one below'],
        ].map(([icon, text]) => (
          <div key={text} className="flex items-center gap-2.5">
            <span className="text-sm">{icon}</span>
            <span className="text-gray-500 text-xs">{text}</span>
          </div>
        ))}
      </div>

      {resent ? (
        <p className="text-emerald-400 text-sm flex items-center gap-2">
          <span>✓</span> New link sent! Check your inbox.
        </p>
      ) : (
        <>
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <button onClick={handleResend} disabled={resending || cooldown > 0}
            className="text-sm text-gray-500 hover:text-brand-cyan transition-colors duration-200 underline underline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed">
            {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
          </button>
        </>
      )}

      <button onClick={onGoToLogin}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-8 rounded-lg bg-brand-cyan text-black font-black text-sm tracking-widest uppercase border border-brand-cyan transition-all duration-300 hover:bg-transparent hover:text-brand-cyan hover:shadow-[0_0_24px_rgba(34,211,238,0.45)]">
        Go to Sign In →
      </button>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Signup() {
  const navigate    = useNavigate()
  const { signup }  = useAuth()

  const [form,     setForm]     = useState({ name: '', email: '', password: '' })
  const [errors,   setErrors]   = useState({})
  const [apiError, setApiError] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [success,  setSuccess]  = useState(false)

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((er) => ({ ...er, [field]: '' }))
    setApiError('')
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim() || form.name.trim().length < 2) errs.name     = 'Name must be at least 2 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))   errs.email    = 'Enter a valid email address.'
    if (form.password.length < 8)                           errs.password = 'Password must be at least 8 characters.'
    if (form.password.match(/^[a-zA-Z]+$/))                errs.password = 'Password must include numbers or symbols.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setApiError('')
    try {
      await signup({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password })
      setSuccess(true)   // show "check your inbox" state
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-brand-purple/[0.06] blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-brand-cyan/[0.05] blur-3xl pointer-events-none" />
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
          {success ? (
            <CheckInboxState
              email={form.email}
              onGoToLogin={() => navigate('/login', { state: { registered: true } })}
            />
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black text-white tracking-tight mb-1.5">Create your account</h1>
                <p className="text-gray-500 text-sm">Join the arena and start earning XP today.</p>
              </div>

              {apiError && (
                <div className="flex items-start gap-3 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 mb-5">
                  <span className="text-red-400 flex-shrink-0">⚠</span>
                  <p className="text-red-400 text-sm leading-relaxed">{apiError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                <Field label="Full Name" id="name" value={form.name} onChange={set('name')}
                  placeholder="Ada Lovelace" error={errors.name} autoComplete="name" />
                <Field label="Email Address" id="email" type="email" value={form.email} onChange={set('email')}
                  placeholder="ada@lovelace.dev" error={errors.email} autoComplete="email" />
                <Field label="Password" id="password" type={showPass ? 'text' : 'password'}
                  value={form.password} onChange={set('password')} placeholder="Minimum 8 characters"
                  error={errors.password} autoComplete="new-password" />
                <StrengthBar password={form.password} />
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={showPass} onChange={() => setShowPass(!showPass)} className="accent-brand-cyan w-3.5 h-3.5" />
                  <span className="text-gray-400 text-xs">Show password</span>
                </label>
                <button type="submit" disabled={loading}
                  className="w-full mt-1 flex items-center justify-center gap-2 py-3.5 px-8 rounded-lg bg-brand-cyan text-black font-black text-sm tracking-widest uppercase border border-brand-cyan transition-all duration-300 hover:bg-transparent hover:text-brand-cyan hover:shadow-[0_0_24px_rgba(34,211,238,0.45)] disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Creating account…</>
                  ) : 'Create Account →'}
                </button>
                <p className="text-center text-gray-500 text-sm pt-1">
                  Already have an account?{' '}
                  <Link to="/login" className="text-brand-cyan hover:text-cyan-300 font-bold transition-colors duration-200">Sign in</Link>
                </p>
              </form>
            </>
          )}
        </div>

        {!success && (
          <p className="text-center text-gray-600 text-xs mt-5">
            By signing up you agree to our{' '}
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors duration-200">Terms</a>
            {' & '}
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors duration-200">Privacy Policy</a>
          </p>
        )}
      </div>
    </div>
  )
}