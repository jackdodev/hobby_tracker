export const dynamic = 'force-dynamic'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getDailyCountMap, getActiveHobbies, getAllLogEntries } from '@/lib/storage'
import { buildCompletionMap, streakFromDateSet } from '@/lib/utils'
import { HeatmapGrid, LEGEND_CELLS, type Cell } from '@/app/stats/components/HeatmapGrid'
import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

function toDateString(d: Date): string {
  return d.toLocaleDateString('en-CA')
}

function buildYearGrid(year: number, dailyMap: Map<string, number>, today: Date): Cell[][] {
  const jan1 = new Date(year, 0, 1)
  const dec31 = new Date(year, 11, 31)

  // Start on Monday of the week containing Jan 1
  const startDow = (jan1.getDay() + 6) % 7
  const gridStart = new Date(jan1)
  gridStart.setDate(jan1.getDate() - startDow)

  // End on Sunday of the week containing Dec 31
  const endDow = (dec31.getDay() + 6) % 7
  const gridEnd = new Date(dec31)
  gridEnd.setDate(dec31.getDate() + (6 - endDow))

  const weeks: Cell[][] = []
  const cursor = new Date(gridStart)
  while (cursor <= gridEnd) {
    const week: Cell[] = []
    for (let d = 0; d < 7; d++) {
      const dateStr = toDateString(cursor)
      week.push({
        date: dateStr,
        count: dailyMap.get(dateStr) ?? 0,
        inFuture: cursor > today,
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const session = await auth()
  const userId = session?.user?.email
  if (!userId) redirect('/login')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toDateString(today)
  const currentYear = today.getFullYear()

  const { year: yearParam } = await searchParams
  const year = Math.min(parseInt(yearParam ?? '') || currentYear, currentYear)

  const [dailyMap, activeHobbies, allEntries] = await Promise.all([
    getDailyCountMap(userId),
    getActiveHobbies(userId),
    getAllLogEntries(userId),
  ])

  const weeks = buildYearGrid(year, dailyMap, today)
  const completionMap = buildCompletionMap(activeHobbies, allEntries)

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-0.5">Stats</h1>
      <p className="text-slate-400 text-sm mb-6">Your activity at a glance.</p>

      {/* Year navigation */}
      <div className="flex items-center justify-between mb-3">
        <Link
          href={`/stats?year=${year - 1}`}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          {year - 1}
        </Link>
        <span className="text-sm font-semibold text-slate-700">{year}</span>
        {year < currentYear ? (
          <Link
            href={`/stats?year=${year + 1}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition-colors"
          >
            {year + 1}
            <ChevronRightIcon className="w-4 h-4" />
          </Link>
        ) : (
          <div className="w-20" />
        )}
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <HeatmapGrid weeks={weeks} totalHobbies={activeHobbies.length} />
        <div className="flex items-center gap-1.5 mt-3 pl-8 text-xs text-slate-400">
          <span>Less</span>
          {LEGEND_CELLS.map((cls) => (
            <div key={cls} className={`h-3 w-3 rounded-[3px] ${cls}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="mt-4 px-1 text-xs text-slate-400">
        Tracking{' '}
        <span className="font-semibold text-slate-600">{activeHobbies.length}</span>{' '}
        active {activeHobbies.length === 1 ? 'hobby' : 'hobbies'}. Each cell reflects how many were completed that day.
      </div>

      {/* Per-hobby streak list */}
      {activeHobbies.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
            Hobbies
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            {activeHobbies.map((hobby) => {
              const completed = completionMap.get(hobby.id) ?? new Set<string>()
              const streak = streakFromDateSet(completed, todayStr)
              return (
                <Link
                  key={hobby.id}
                  href={`/stats/${hobby.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                >
                  <span className="text-sm font-medium text-slate-700 flex-1 truncate group-hover:text-indigo-600 transition-colors">
                    {hobby.name}
                  </span>
                  <span className={`text-sm font-semibold shrink-0 ${streak.current > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                    🔥 {streak.current}d
                  </span>
                  <span className="text-xs text-slate-400 shrink-0">best {streak.best}d</span>
                  <ChevronRightIcon className="w-4 h-4 text-slate-300 shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
