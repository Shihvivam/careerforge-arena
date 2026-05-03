/**
 * src/pages/Dashboard.jsx
 * Protected dashboard — only accessible with a valid JWT.
 * Displays user stats, XP progress, recent activity, and quick actions.
 */

import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { apiGetMe } from '../services/api'
import Button from '../components/common/Button'

// ── Helpers ────────────────────────────────────────────────────────────────
const xpForLevel = (level) => level * 1000 + (level - 1) * 500
const xpProgress  = (xp, level) => {
  const base = xpForLevel(level - 1 || 1)
  const next = xpForLevel(level)
  return Math.min(100, Math.round(((xp - base) / (next - base)) * 100))
}

// ── Sub-components ─────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, accent = 'cyan' }) => {
  const colors = {
    cyan:   'border-brand-cyan/20  bg-brand-cyan/5   text-brand-cyan',
    purple: 'border-brand-purple/20 bg-brand-purple/5 text-brand-purple',
    orange: 'border-orange-500/20  bg-orange-500/5   text-orange-400',
    green:  'border-emerald-500/20 bg-emerald-500/5  text-emerald-400',
  }
  return (
    <div className={`flex flex-col gap-3 p-5 rounded-2xl bg-brand-card border ${colors[accent].split(' ')[0]} hover:${colors[accent].split(' ')[0].replace('/20','/40')} transition-all duration-300`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${colors[accent].split(' ')[1]}`}>{icon}</div>
      <div>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-2xl font-black ${colors[accent].split(' ')[2]}`}>{value}</p>
        {sub && <p className="text-gray-600 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const ActivityItem = ({ icon, title, detail, time, xpGain }) => (
  <div className="flex items-center gap-4 py-3.5 border-b border-white/[0.04] last:border-0">
    <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center text-base flex-shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-white text-sm font-semibold truncate">{title}</p>
      <p className="text-gray-500 text-xs truncate">{detail}</p>
    </div>
    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
      <span className="text-brand-cyan text-xs font-bold">+{xpGain} XP</span>
      <span className="text-gray-600 text-[10px]">{time}</span>
    </div>
  </div>
)

const QuickActionCard = ({ icon, label, description, tag, onClick }) => (
  <button
    onClick={onClick}
    className="group flex flex-col gap-3 p-5 rounded-2xl bg-brand-card border border-white/5 hover:border-brand-cyan/30 text-left transition-all duration-300 hover:-translate-y-0.5 w-full"
  >
    <div className="flex items-start justify-between">
      <span className="text-2xl">{icon}</span>
      {tag && <span className="text-[10px] font-black tracking-widest text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 px-2 py-0.5 rounded-full">{tag}</span>}
    </div>
    <div>
      <p className="text-white font-bold text-sm group-hover:text-brand-cyan transition-colors duration-200">{label}</p>
      <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{description}</p>
    </div>
  </button>
)

// ── Mock activity feed (replace with real API data later) ──────────────────
const RECENT_ACTIVITY = [
  { icon: '⚔️', title: 'Two Sum',           detail: 'Array · Easy',          time: '2h ago',  xpGain: 120 },
  { icon: '🧩', title: 'LRU Cache',          detail: 'Design · Medium',       time: '1d ago',  xpGain: 250 },
  { icon: '🌲', title: 'Binary Tree Paths',  detail: 'Tree · Medium',         time: '2d ago',  xpGain: 200 },
  { icon: '📡', title: 'System Design: URL Shortener', detail: 'System Design · Hard', time: '3d ago', xpGain: 500 },
]

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user: ctxUser, logout } = useAuth()
  const navigate = useNavigate()

  const [user,       setUser]       = useState(ctxUser)
  const [refreshing, setRefreshing] = useState(false)
  const [error,      setError]      = useState('')

  // Refresh user data from /auth/me on mount
  useEffect(() => {
    const refresh = async () => {
      try {
        setRefreshing(true)
        const fresh = await apiGetMe()
        setUser(fresh)
      } catch {
        setError('Could not refresh your profile.')
      } finally {
        setRefreshing(false)
      }
    }
    refresh()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!user) return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-500 text-sm tracking-widest uppercase">Loading profile…</span>
      </div>
    </div>
  )

  const progress  = xpProgress(user.xp, user.level)
  const xpToNext  = xpForLevel(user.level) - user.xp
  const firstName = user.name?.split(' ')[0] || 'Player'

  return (
    <div className="min-h-screen bg-brand-bg text-white font-sans antialiased">

      {/* ── Top navbar ── */}
      <header className="border-b border-white/5 bg-brand-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-brand-cyan flex items-center justify-center shadow-[0_0_16px_rgba(34,211,238,0.4)]">
              <span className="text-black font-black text-sm">CF</span>
            </div>
            <span className="font-black text-white text-lg tracking-tight">
              Career<span className="text-brand-cyan">Forge</span>
              <span className="text-gray-500 font-semibold text-sm ml-1">Arena</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Streak badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1.5">
              <span className="text-base">🔥</span>
              <span className="text-orange-400 text-xs font-black">{user.streak} day streak</span>
            </div>

            {/* Avatar + name */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center text-black font-black text-sm">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm font-semibold text-gray-300">{user.name}</span>
            </div>

            <Button size="sm" variant="ghost" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-10">

        {/* ── Error banner ── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/8 border border-red-500/20 rounded-xl px-5 py-3">
            <span className="text-red-400">⚠</span>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* ── Hero greeting ── */}
        <section className="relative rounded-3xl overflow-hidden border border-white/5 bg-brand-card p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 via-transparent to-brand-purple/8 pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-brand-cyan/8 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,1) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center text-black font-black text-2xl shadow-[0_0_24px_rgba(34,211,238,0.3)]">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-1.5 -right-1.5 bg-brand-bg border border-brand-cyan/40 text-brand-cyan text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  Lv.{user.level}
                </span>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Welcome back,</p>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {firstName} <span className="text-brand-cyan">🎮</span>
                </h1>
                <p className="text-gray-500 text-xs mt-1">{user.email}</p>
              </div>
            </div>

            {/* XP Progress */}
            <div className="w-full md:w-72 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-widest">XP Progress</span>
                <span className="text-brand-cyan font-black">{user.xp.toLocaleString()} XP</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-cyan to-brand-purple shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Level {user.level}</span>
                <span className="text-gray-600">{xpToNext.toLocaleString()} XP to Level {user.level + 1}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats row ── */}
        <section>
          <h2 className="text-xs font-black tracking-widest uppercase text-gray-500 mb-4">Your Stats</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="⚡" label="Total XP"    value={user.xp.toLocaleString()}  sub="Experience points"    accent="cyan"   />
            <StatCard icon="🏅" label="Level"       value={user.level}                sub={`${progress}% to Lv.${user.level + 1}`} accent="purple" />
            <StatCard icon="🔥" label="Streak"      value={`${user.streak}d`}         sub="Keep it going!"       accent="orange" />
            <StatCard icon="✅" label="Challenges"  value="—"                         sub="Start solving today"  accent="green"  />
          </div>
        </section>

        {/* ── Two-col layout: activity + quick actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-brand-card border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Recent Activity</h2>
              <span className="text-xs text-brand-cyan cursor-pointer hover:text-cyan-300 transition-colors duration-200">View all →</span>
            </div>

            {refreshing ? (
              <div className="flex flex-col gap-3.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-3.5 border-b border-white/[0.04] last:border-0">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] animate-pulse flex-shrink-0" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="h-3 bg-white/[0.04] rounded animate-pulse w-40" />
                      <div className="h-2.5 bg-white/[0.03] rounded animate-pulse w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              RECENT_ACTIVITY.map((item) => <ActivityItem key={item.title} {...item} />)
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Quick Actions</h2>
            <QuickActionCard
              icon="⚔️" label="Daily Challenge"
              description="Solve today's featured problem and keep your streak alive."
              tag="DAILY"
              onClick={() => {}}
            />
            <QuickActionCard
              icon="🏆" label="Leaderboard"
              description="See how you rank against other players this week."
              onClick={() => {}}
            />
            <QuickActionCard
              icon="📊" label="Skill Tree"
              description="Explore your skill map and unlock new challenge paths."
              onClick={() => {}}
            />
          </div>
        </div>

        {/* ── Career readiness bar ── */}
        <section className="bg-brand-card border border-white/5 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-1">Career Readiness</h2>
              <p className="text-gray-600 text-xs">Complete more challenges to boost your score.</p>
            </div>
            <div className="flex items-center gap-2 bg-brand-cyan/5 border border-brand-cyan/20 rounded-full px-4 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
              <span className="text-brand-cyan text-xs font-bold">Profile visible to recruiters</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Algorithms',    pct: 42, color: 'from-brand-cyan to-cyan-300' },
              { label: 'System Design', pct: 15, color: 'from-brand-purple to-purple-300' },
              { label: 'Behavioural',   pct: 0,  color: 'from-orange-400 to-orange-300' },
            ].map(({ label, pct, color }) => (
              <div key={label} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-semibold">{label}</span>
                  <span className="text-white font-black">{pct}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA footer ── */}
        <section className="relative rounded-2xl overflow-hidden border border-brand-cyan/10 bg-brand-card p-8 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan/5 via-transparent to-brand-purple/5 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-2xl mb-2">🚀</p>
            <h3 className="text-white font-black text-lg tracking-tight mb-1">Ready to level up?</h3>
            <p className="text-gray-500 text-sm mb-5">Start a new challenge and keep your streak alive.</p>
            <Button size="md" className="mx-auto">Browse Challenges</Button>
          </div>
        </section>

      </main>
    </div>
  )
}
