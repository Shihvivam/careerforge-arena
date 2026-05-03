/**
 * src/pages/Login.jsx
 * Login page — calls POST /auth/login, stores JWT, redirects to /dashboard.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/common/Button'

const InputField = ({ label, id, type = 'text', value, onChange, placeholder, error, autoComplete }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-bold tracking-widest uppercase text-gray-400">{label}</label>
    <input
      id={id} type={type} value={value} onChange={onChange}
      placeholder={placeholder} autoComplete={autoComplete}
      className={`w-full bg-white/[0.04] border ${error ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-brand-cyan/60'} rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 outline-none transition-colors duration-200 focus:bg-white/[0.06]`}
    />
    {error && <p className="text-red-400 text-xs mt-0.5">{error}</p>}
  </div>
)

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form,     setForm]     = useState({ email: '', password: '' })
  const [errors,   setErrors]   = useState({})
  const [loading,  setLoading]  = useState(false)
  const [apiError, setApiError] = useState('')

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((er) => ({ ...er, [field]: '' }))
    setApiError('')
  }

  const validate = () => {
    const errs = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.'
    if (!form.password)                                   errs.password = 'Password is required.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await login({ email: form.email.trim().toLowerCase(), password: form.password })
      navigate('/dashboard')
    } catch (err) {
      setApiError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-brand-cyan/[0.05] blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-brand-purple/[0.05] blur-3xl pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,1) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,1) 1px,transparent 1px)', backgroundSize: '50px 50px' }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 mb-8 w-fit mx-auto">
          <div className="w-9 h-9 rounded bg-brand-cyan flex items-center justify-center shadow-[0_0_16px_rgba(34,211,238,0.4)]">
            <span className="text-black font-black text-sm">CF</span>
          </div>
          <span className="font-black text-white text-lg tracking-tight">Career<span className="text-brand-cyan">Forge</span> <span className="text-gray-500 font-semibold text-sm">Arena</span></span>
        </Link>

        {/* Card */}
        <div className="bg-brand-card border border-white/8 rounded-2xl p-8 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white tracking-tight mb-2">Welcome back</h1>
            <p className="text-gray-500 text-sm">Sign in to continue your journey.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            {apiError && (
              <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/25 rounded-lg px-4 py-3">
                <span className="text-red-400 text-sm flex-shrink-0 mt-0.5">⚠</span>
                <p className="text-red-400 text-sm leading-relaxed">{apiError}</p>
              </div>
            )}

            <InputField label="Email Address" id="email"    type="email"    value={form.email}    onChange={set('email')}    placeholder="ada@lovelace.dev"   error={errors.email}    autoComplete="email" />
            <InputField label="Password"      id="password" type="password" value={form.password} onChange={set('password')} placeholder="Your password"       error={errors.password} autoComplete="current-password" />

            <div className="flex items-center justify-between text-xs -mt-1">
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer select-none">
                <input type="checkbox" className="accent-brand-cyan w-3.5 h-3.5" />
                Remember me
              </label>
              <a href="#" className="text-brand-cyan hover:text-cyan-300 transition-colors duration-200">Forgot password?</a>
            </div>

            <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
              Sign In
            </Button>

            <p className="text-center text-gray-500 text-sm">
              New to CareerForge?{' '}
              <Link to="/signup" className="text-brand-cyan hover:text-cyan-300 font-semibold transition-colors duration-200">Create account</Link>
            </p>
          </form>
        </div>

        {/* Demo hint */}
        <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
          <p className="text-gray-600 text-xs">Don't have an account yet?{' '}
            <Link to="/signup" className="text-brand-cyan/70 hover:text-brand-cyan transition-colors duration-200 font-semibold">Sign up free →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
