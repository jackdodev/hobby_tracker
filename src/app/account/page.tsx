export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getActiveHobbies, getHobbies, getAllLogEntries, computeStreak } from '@/lib/storage'
import { logout } from '@/actions/auth'

function getInitials(userId: string): string {
  const name = userId.split('@')[0]
  return name.slice(0, 2).toUpperCase()
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
      <p className="text-2xl font-bold text-slate-800 tabular-nums">{value.toLocaleString()}</p>
      <p className="text-xs text-slate-400 mt-1 leading-tight">{label}</p>
    </div>
  )
}

export default async function AccountPage() {
  const jar = await cookies()
  const userId = jar.get('userId')?.value ?? ''

  const today = new Date().toLocaleDateString('en-CA')
  const initials = getInitials(userId)

  const [activeHobbies, allHobbies, allEntries] = await Promise.all([
    getActiveHobbies(userId),
    getHobbies(userId),
    getAllLogEntries(userId),
  ])

  // All-time summary
  const uniqueDays = new Set(allEntries.map((e) => e.date)).size
  const firstDate = allEntries.length > 0
    ? allEntries.reduce((min, e) => (e.date < min ? e.date : min), allEntries[0].date)
    : null
  const trackingSince = firstDate
    ? new Date(firstDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  const hobbyMap = new Map(allHobbies.map((h) => [h.id, h]))
  const totalCompletions = allEntries.filter((e) => {
    const hobby = hobbyMap.get(e.hobbyId)
    if (!hobby || hobby.type === 'boolean' || !hobby.goal) return true
    return (e.value ?? 0) >= hobby.goal.target
  }).length

  // Top streaks across active hobbies
  const streakResults = await Promise.all(
    activeHobbies.map(async (h) => ({
      name: h.name,
      streak: await computeStreak(userId, h.id, today),
    }))
  )
  const topStreaks = streakResults
    .filter((s) => s.streak.best > 0)
    .sort((a, b) => b.streak.current - a.streak.current || b.streak.best - a.streak.best)
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar + username */}
      <div className="flex flex-col items-center pt-6 pb-2 gap-3">
        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700 select-none">
          {initials}
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-800">{userId}</p>
          {trackingSince && (
            <p className="text-xs text-slate-400 mt-0.5">Tracking since {trackingSince}</p>
          )}
        </div>
      </div>

      {/* All-time stats */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">All-time</h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Days tracked" value={uniqueDays} />
          <StatCard label="Completions" value={totalCompletions} />
          <StatCard label="Active hobbies" value={activeHobbies.length} />
        </div>
      </div>

      {/* Top streaks */}
      {topStreaks.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Top Streaks</h2>
          <ul className="flex flex-col divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
            {topStreaks.map((s, i) => (
              <li key={s.name} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xs font-medium text-slate-300 w-4 shrink-0 tabular-nums">{i + 1}</span>
                <span className="text-sm font-medium text-slate-800 flex-1 min-w-0 truncate">{s.name}</span>
                <span className={`text-sm font-semibold shrink-0 ${s.streak.current > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                  🔥 {s.streak.current}d
                </span>
                <span className="text-xs text-slate-400 shrink-0">best {s.streak.best}d</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {allEntries.length === 0 && (
        <div className="text-center py-6">
          <p className="text-slate-400 text-sm">No activity yet — start logging hobbies to see your stats here.</p>
        </div>
      )}

      {/* Log out */}
      <div className="pt-2 pb-4">
        <form action={logout}>
          <button
            type="submit"
            className="w-full px-4 py-2.5 border border-rose-200 text-rose-600 text-sm font-medium rounded-xl hover:bg-rose-50 transition-colors"
          >
            Log out
          </button>
        </form>
      </div>
    </div>
  )
}
