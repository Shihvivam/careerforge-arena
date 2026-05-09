/**
 * src/pages/Dashboard.jsx
 * Protected — only rendered after ProtectedRoute confirms auth.
 * Uses useAuth() for live user data (survives refresh via AuthContext hydration).
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const XP_PER_LEVEL = (lvl) => lvl * 1000 + (lvl - 1) * 500
const xpProgressPct = (xp, level) => {
  const base = level > 1 ? XP_PER_LEVEL(level - 1) : 0
  const next  = XP_PER_LEVEL(level)
  return Math.min(100, Math.round(((xp - base) / (next - base)) * 100))
}

function StatCard({ icon, label, value, sub, accent }) {
  const styles = {
    cyan:   'border-brand-cyan/20 bg-brand-cyan/[0.04]',
    purple: 'border-brand-purple/20 bg-brand-purple/[0.04]',
    orange: 'border-orange-500/20 bg-orange-500/[0.04]',
    green:  'border-emerald-400/20 bg-emerald-400/[0.04]',
  }
  const text = {
    cyan:   'text-brand-cyan',
    purple: 'text-brand-purple',
    orange: 'text-orange-400',
    green:  'text-emerald-400',
  }
  return (
    <div className={`flex flex-col gap-3 p-5 rounded-2xl border ${styles[accent]} hover:translate-y-[-2px] transition-all duration-300`}>
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-3xl font-black tracking-tight ${text[accent]}`}>{value}</p>
        {sub && <p className="text-gray-600 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const RECENT_ACTIVITY = [
  { icon: '⚔️', title: 'Two Sum',              detail: 'Array · Easy',          time: '2h ago',  xp: 120 },
  { icon: '🧩', title: 'LRU Cache',             detail: 'Design · Medium',       time: '1d ago',  xp: 250 },
  { icon: '🌲', title: 'Binary Tree Paths',     detail: 'Tree · Medium',         time: '2d ago',  xp: 200 },
  { icon: '📡', title: 'URL Shortener Design',  detail: 'System Design · Hard',  time: '3d ago',  xp: 500 },
]

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [refreshing, setRefreshing] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshUser()
    setRefreshing(false)
  }

  const progress  = xpProgressPct(user?.xp ?? 0, user?.level ?? 1)
  const xpToNext  = XP_PER_LEVEL(user?.level ?? 1) - (user?.xp ?? 0)
  const firstName = user?.name?.split(' ')[0] || 'Player'

  return (
    <div className="min-h-screen bg-brand-bg text-white font-sans antialiased">

      {/* ── Sticky top bar ── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-brand-bg/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-cyan flex items-center justify-center text-black font-black text-sm shadow-[0_0_16px_rgba(34,211,238,0.4)]">CF</div>
            <span className="font-black text-white text-lg tracking-tight">
              Career<span className="text-brand-cyan">Forge</span>
              <span className="text-gray-500 font-semibold text-sm ml-1">Arena</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Streak */}
            <div className="hidden sm:flex items-center gap-1.5 bg-orange-500/8 border border-orange-500/20 rounded-full px-3 py-1.5">
              <span>🔥</span>
              <span className="text-orange-400 text-xs font-black">{user?.streak ?? 0} day streak</span>
            </div>

            {/* Refresh button */}
            <button onClick={handleRefresh} disabled={refreshing}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10
                text-gray-500 hover:text-brand-cyan hover:border-brand-cyan/30 transition-all duration-200
                disabled:opacity-40">
              <span className={`text-sm ${refreshing ? 'animate-spin' : ''}`}>↻</span>
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center text-black font-black text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>

            <button onClick={handleLogout}
              className="text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-white
                border border-gray-700 hover:border-gray-500 rounded px-3 py-1.5 transition-all duration-200">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-10">

        {/* ── Hero greeting + XP bar ── */}
        <section className="relative rounded-3xl overflow-hidden border border-white/5 bg-brand-card p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 via-transparent to-brand-purple/8 pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-cyan/8 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,1) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center text-black font-black text-2xl shadow-[0_0_28px_rgba(34,211,238,0.3)]">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-1.5 -right-1.5 bg-brand-bg border border-brand-cyan/40 text-brand-cyan text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap">
                  Lv.{user?.level ?? 1}
                </span>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-0.5">Welcome back,</p>
                <h1 className="text-3xl font-black text-white tracking-tight">{firstName} <span className="text-brand-cyan">🎮</span></h1>
                <p className="text-gray-600 text-xs mt-1">{user?.email}</p>
              </div>
            </div>

            {/* XP Progress */}
            <div className="w-full md:w-80 flex flex-col gap-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-widest">XP Progress</span>
                <span className="text-brand-cyan font-black">{(user?.xp ?? 0).toLocaleString()} XP</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-cyan to-brand-purple shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Level {user?.level ?? 1}</span>
                <span>{xpToNext.toLocaleString()} XP to Level {(user?.level ?? 1) + 1}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats row ── */}
        <section>
          <h2 className="text-xs font-black tracking-widest uppercase text-gray-500 mb-4">Your Stats</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="⚡" label="Total XP"   value={(user?.xp ?? 0).toLocaleString()} sub="Experience points"       accent="cyan"   />
            <StatCard icon="🏅" label="Level"       value={user?.level ?? 1}                 sub={`${progress}% to next`}  accent="purple" />
            <StatCard icon="🔥" label="Day Streak"  value={`${user?.streak ?? 0}d`}          sub="Keep it going!"          accent="orange" />
            <StatCard icon="✅" label="Challenges"  value="—"                                sub="Start solving today"     accent="green"  />
          </div>
        </section>

        {/* ── Activity + Quick actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent activity */}
          <div className="lg:col-span-2 bg-brand-card border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Recent Activity</h2>
              <span className="text-xs text-brand-cyan cursor-pointer hover:text-cyan-300 transition-colors duration-200">View all →</span>
            </div>
            <div className="flex flex-col">
              {RECENT_ACTIVITY.map((item, i) => (
                <div key={i} className="flex items-center gap-4 py-3.5 border-b border-white/[0.04] last:border-0">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center text-base flex-shrink-0">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{item.title}</p>
                    <p className="text-gray-500 text-xs">{item.detail}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-brand-cyan text-xs font-black">+{item.xp} XP</p>
                    <p className="text-gray-600 text-[10px]">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Quick Actions</h2>
            {[
              { icon: '⚔️', label: 'Daily Challenge',  desc: 'Solve today\'s featured problem and protect your streak.' },
              { icon: '🏆', label: 'Leaderboard',       desc: 'See how you rank this week.' },
              { icon: '📊', label: 'Skill Tree',         desc: 'Explore your progress map.' },
            ].map((a) => (
              <button key={a.label}
                className="group flex flex-col gap-2.5 p-5 rounded-2xl bg-brand-card border border-white/5
                  hover:border-brand-cyan/30 text-left transition-all duration-300 hover:-translate-y-0.5 w-full">
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <p className="text-white font-bold text-sm group-hover:text-brand-cyan transition-colors duration-200">{a.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{a.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Career readiness ── */}
        <section className="bg-brand-card border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Career Readiness</h2>
              <p className="text-gray-600 text-xs">Complete more challenges to boost your score.</p>
            </div>
            <span className="flex items-center gap-2 text-xs text-brand-cyan bg-brand-cyan/8 border border-brand-cyan/20 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
              Visible to recruiters
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: 'Algorithms',    pct: 42, color: 'from-brand-cyan to-cyan-300'     },
              { label: 'System Design', pct: 15, color: 'from-brand-purple to-purple-300' },
              { label: 'Behavioural',   pct: 0,  color: 'from-orange-400 to-orange-300'   },
            ].map(({ label, pct, color }) => (
              <div key={label} className="flex flex-col gap-2">
                <div className="flex justify-between text-xs">
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

      </main>
    </div>
  )
}