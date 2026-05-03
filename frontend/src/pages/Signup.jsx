/**
 * src/pages/Signup.jsx
 * Registration page — calls POST /auth/signup, redirects to /login on success.
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

export default function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()

  const [form,    setForm]    = useState({ name: '', email: '', password: '' })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [success,  setSuccess]  = useState(false)

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((er) => ({ ...er, [field]: '' }))
    setApiError('')
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))   errs.email = 'Enter a valid email address.'
    if (form.password.length < 8)                           errs.password = 'Password must be at least 8 characters.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await signup({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-brand-purple/[0.06] blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-brand-cyan/[0.05] blur-3xl pointer-events-none" />
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
            <h1 className="text-2xl font-black text-white tracking-tight mb-2">Create your account</h1>
            <p className="text-gray-500 text-sm">Join the arena and start earning XP today.</p>
          </div>

          {/* Success state */}
          {success ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-3xl">✅</div>
              <div className="text-center">
                <p className="text-white font-bold text-lg">Account created!</p>
                <p className="text-gray-400 text-sm mt-1">Redirecting you to login…</p>
              </div>
              <div className="w-8 h-8 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin mt-2" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              {apiError && (
                <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/25 rounded-lg px-4 py-3">
                  <span className="text-red-400 text-sm flex-shrink-0 mt-0.5">⚠</span>
                  <p className="text-red-400 text-sm leading-relaxed">{apiError}</p>
                </div>
              )}

              <InputField label="Full Name"     id="name"     value={form.name}     onChange={set('name')}     placeholder="Ada Lovelace"              error={errors.name}     autoComplete="name" />
              <InputField label="Email Address" id="email"    type="email"  value={form.email}    onChange={set('email')}    placeholder="ada@lovelace.dev"          error={errors.email}    autoComplete="email" />
              <InputField label="Password"      id="password" type="password" value={form.password} onChange={set('password')} placeholder="Minimum 8 characters"      error={errors.password} autoComplete="new-password" />

              {/* Password strength */}
              {form.password.length > 0 && (
                <div className="flex gap-1.5 -mt-2">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      form.password.length >= i * 3
                        ? i <= 1 ? 'bg-red-500' : i <= 2 ? 'bg-orange-400' : i <= 3 ? 'bg-yellow-400' : 'bg-green-400'
                        : 'bg-white/10'
                    }`} />
                  ))}
                </div>
              )}

              <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
                Create Account
              </Button>

              <p className="text-center text-gray-500 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-brand-cyan hover:text-cyan-300 font-semibold transition-colors duration-200">Sign in</Link>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          By signing up, you agree to our{' '}
          <a href="#" className="text-gray-500 hover:text-white transition-colors duration-200">Terms</a>
          {' & '}
          <a href="#" className="text-gray-500 hover:text-white transition-colors duration-200">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
