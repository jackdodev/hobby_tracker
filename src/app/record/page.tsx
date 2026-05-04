import { cookies } from 'next/headers'
import { getHobbies, getAllLogEntries } from '@/lib/storage'
import { streakFromDateSet, buildCompletionMap, isEntryComplete } from '@/lib/utils'

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function formatMonth(yearMonth: string): string {
  const [year, mon] = yearMonth.split('-').map(Number)
  return new Date(year, mon - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default async function HistoryPage() {
  const jar = await cookies()
  const userId = jar.get('userId')?.value ?? ''

  const [allHobbies, allEntries] = await Promise.all([
    getHobbies(userId),
    getAllLogEntries(userId),
  ])

  const active = allHobbies.filter((h) => h.removedAt === null)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toLocaleDateString('en-CA')

  const completionMap = buildCompletionMap(active, allEntries)

  // ── Summary stats ──────────────────────────────────────────
  const allDates = new Set(allEntries.map((e) => e.date))
  const daysTracked = allDates.size

  const totalCompletions = allEntries.filter((e) => {
    const hobby = allHobbies.find((h) => h.id === e.hobbyId)
    return hobby ? isEntryComplete(hobby, e) : false
  }).length

  const trackingSince =
    allEntries.length > 0
      ? [...allDates].sort()[0]
      : null

  // Perfect days: every active hobby completed
  let perfectDays = 0
  if (active.length > 0) {
    for (const date of allDates) {
      if (date > todayStr) continue
      const allDone = active.every((h) => completionMap.get(h.id)?.has(date))
      if (allDone) perfectDays++
    }
  }

  // ── Records ────────────────────────────────────────────────
  // Best streak ever (across all hobbies)
  let topStreakHobby: { name: string; best: number } | null = null
  // Current best streak
  let topCurrentHobby: { name: string; current: number } | null = null
  // Most consistent (highest completion rate)
  let mostConsistentHobby: { name: string; rate: number } | null = null

  for (const hobby of active) {
    const completed = completionMap.get(hobby.id) ?? new Set<string>()
    const streak = streakFromDateSet(completed, todayStr)
    const rate = daysTracked > 0 ? Math.round((completed.size / daysTracked) * 100) : 0

    if (!topStreakHobby || streak.best > topStreakHobby.best) {
      topStreakHobby = { name: hobby.name, best: streak.best }
    }
    if (streak.current > 0 && (!topCurrentHobby || streak.current > topCurrentHobby.current)) {
      topCurrentHobby = { name: hobby.name, current: streak.current }
    }
    if (!mostConsistentHobby || rate > mostConsistentHobby.rate) {
      mostConsistentHobby = { name: hobby.name, rate }
    }
  }

  // Best month: highest ratio of perfect days in a month
  const monthPerfectMap = new Map<string, number>()
  for (const date of allDates) {
    if (date > todayStr) continue
    if (active.length === 0) continue
    const allDone = active.every((h) => completionMap.get(h.id)?.has(date))
    if (allDone) {
      const ym = date.slice(0, 7)
      monthPerfectMap.set(ym, (monthPerfectMap.get(ym) ?? 0) + 1)
    }
  }

  let bestMonth: { label: string; perfectDays: number } | null = null
  for (const [ym, count] of monthPerfectMap) {
    if (!bestMonth || count > bestMonth.perfectDays) {
      bestMonth = { label: formatMonth(ym), perfectDays: count }
    }
  }

  // ── Per-hobby stats ────────────────────────────────────────
  const hobbyStats = active.map((hobby) => {
    const completed = completionMap.get(hobby.id) ?? new Set<string>()
    const streak = streakFromDateSet(completed, todayStr)
    const rate = daysTracked > 0 ? Math.round((completed.size / daysTracked) * 100) : 0
    return { hobby, streak, rate, completions: completed.size }
  })

  const hasData = allEntries.length > 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-0.5">Records</h1>
      <p className="text-slate-400 text-sm mb-6">Your all-time personal bests.</p>

      {!hasData ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-slate-500 text-sm mb-2">No records yet — start tracking to build your history.</p>
          <a href="/" className="text-indigo-500 text-sm font-medium hover:text-indigo-700 transition-colors">
            Log today&apos;s hobbies
          </a>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Days Tracked', value: daysTracked },
              { label: 'Completions', value: totalCompletions },
              { label: 'Perfect Days', value: perfectDays },
              {
                label: 'Tracking Since',
                value: trackingSince
                  ? new Date(trackingSince + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—',
              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
              </div>
            ))}
          </div>

          {/* Records */}
          {active.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Records
              </h2>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 mb-6">
                {topStreakHobby && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xl">🏆</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400">Longest streak ever</p>
                      <p className="text-sm font-medium text-slate-700 truncate">{topStreakHobby.name}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 tabular-nums shrink-0">
                      {topStreakHobby.best}d
                    </span>
                  </div>
                )}
                {topCurrentHobby && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xl">🔥</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400">Current best streak</p>
                      <p className="text-sm font-medium text-slate-700 truncate">{topCurrentHobby.name}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 tabular-nums shrink-0">
                      {topCurrentHobby.current}d
                    </span>
                  </div>
                )}
                {mostConsistentHobby && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xl">⭐</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400">Most consistent</p>
                      <p className="text-sm font-medium text-slate-700 truncate">{mostConsistentHobby.name}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 tabular-nums shrink-0">
                      {mostConsistentHobby.rate}%
                    </span>
                  </div>
                )}
                {bestMonth && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xl">📅</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400">Best month</p>
                      <p className="text-sm font-medium text-slate-700 truncate">{bestMonth.label}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 tabular-nums shrink-0">
                      {bestMonth.perfectDays}d
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Per-hobby breakdown */}
          {hobbyStats.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                By Hobby
              </h2>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                {hobbyStats
                  .sort((a, b) => b.streak.current - a.streak.current || b.streak.best - a.streak.best)
                  .map(({ hobby, streak, rate, completions }) => (
                    <div key={hobby.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-sm font-medium text-slate-700 flex-1 truncate">{hobby.name}</span>
                      <span className="text-xs text-slate-400 tabular-nums shrink-0">{completions} days</span>
                      <span className="text-xs text-slate-400 tabular-nums shrink-0 w-12 text-right">
                        🔥 {streak.current}d
                      </span>
                      <span className="text-sm font-semibold text-emerald-600 tabular-nums shrink-0 w-10 text-right">
                        {rate}%
                      </span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
