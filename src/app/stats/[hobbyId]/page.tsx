export const dynamic = 'force-dynamic'

import { auth } from '@/auth'
import { notFound, redirect } from 'next/navigation'
import { getHobbies, getAllLogEntries } from '@/lib/storage'
import { isEntryComplete, streakFromDateSet } from '@/lib/utils'
import { HeatmapGrid, LEGEND_CELLS, type Cell } from '@/app/stats/components/HeatmapGrid'
import Link from 'next/link'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

const TYPE_BADGE: Record<string, string> = {
  boolean:  'bg-slate-100 text-slate-600',
  counter:  'bg-indigo-100 text-indigo-700',
  quantity: 'bg-cyan-100 text-cyan-700',
  time:     'bg-violet-100 text-violet-700',
}

function toDateString(d: Date): string {
  return d.toLocaleDateString('en-CA')
}

function buildYearGrid(year: number, completedDates: Set<string>, today: Date): Cell[][] {
  const jan1 = new Date(year, 0, 1)
  const dec31 = new Date(year, 11, 31)

  const startDow = (jan1.getDay() + 6) % 7
  const gridStart = new Date(jan1)
  gridStart.setDate(jan1.getDate() - startDow)

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
        count: completedDates.has(dateStr) ? 1 : 0,
        inFuture: cursor > today,
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

type StatCardProps = { label: string; value: string | number; sub?: string }
function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
      <p className="text-2xl font-bold text-slate-800 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-slate-400 tabular-nums">{sub}</p>}
      <p className="text-xs text-slate-400 mt-1 leading-tight">{label}</p>
    </div>
  )
}

export default async function HobbyStatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ hobbyId: string }>
  searchParams: Promise<{ year?: string }>
}) {
  const session = await auth()
  const userId = session?.user?.email
  if (!userId) redirect('/login')

  const { hobbyId } = await params
  const { year: yearParam } = await searchParams

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toDateString(today)
  const currentYear = today.getFullYear()
  const year = Math.min(parseInt(yearParam ?? '') || currentYear, currentYear)

  const [allHobbies, allEntries] = await Promise.all([
    getHobbies(userId),
    getAllLogEntries(userId),
  ])

  const hobby = allHobbies.find((h) => h.id === hobbyId)
  if (!hobby) notFound()

  const hobbyEntries = allEntries.filter((e) => e.hobbyId === hobbyId)
  const completedDates = new Set(
    hobbyEntries.filter((e) => isEntryComplete(hobby, e)).map((e) => e.date)
  )

  const streak = streakFromDateSet(completedDates, todayStr)
  const totalCompletions = completedDates.size

  // Completion rate: completions / days tracked (unique days any entry exists)
  const totalDaysTracked = new Set(allEntries.map((e) => e.date)).size
  const rate = totalDaysTracked > 0 ? Math.round((totalCompletions / totalDaysTracked) * 100) : 0

  const weeks = buildYearGrid(year, completedDates, today)

  // Monthly breakdown: last 12 months
  const monthBreakdown: { label: string; completed: number; total: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const ym = `${y}-${String(m).padStart(2, '0')}`
    const total = daysInMonth(y, m)
    const completed = [...completedDates].filter((date) => date.startsWith(ym)).length
    monthBreakdown.push({
      label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      completed,
      total,
    })
  }

  const goalSummary = hobby.goal
    ? `${hobby.goal.target} ${hobby.goal.unit}`
    : null

  return (
    <div className="flex flex-col gap-6">
      {/* Back nav */}
      <Link
        href="/stats"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 transition-colors -mb-2"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Stats
      </Link>

      {/* Hobby header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{hobby.name}</h1>
          {goalSummary && (
            <p className="text-sm text-slate-400 mt-0.5">Goal: {goalSummary}</p>
          )}
        </div>
        <span className={`shrink-0 mt-1 text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_BADGE[hobby.type]}`}>
          {hobby.type}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Current streak" value={`${streak.current}d`} />
        <StatCard label="Best streak" value={`${streak.best}d`} />
        <StatCard label="Total completions" value={totalCompletions} />
        <StatCard label="Completion rate" value={`${rate}%`} />
      </div>

      {/* Year heatmap */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{year}</h2>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Link href={`/stats/${hobbyId}?year=${year - 1}`} className="hover:text-slate-600 transition-colors">
              ← {year - 1}
            </Link>
            {year < currentYear && (
              <Link href={`/stats/${hobbyId}?year=${year + 1}`} className="hover:text-slate-600 transition-colors">
                {year + 1} →
              </Link>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <HeatmapGrid
            weeks={weeks}
            totalHobbies={1}
            getTitle={(cell) => `${cell.date}: ${cell.count ? 'completed' : 'not completed'}`}
          />
          <div className="flex items-center gap-1.5 mt-3 pl-8 text-xs text-slate-400">
            <span>Less</span>
            {LEGEND_CELLS.map((cls) => (
              <div key={cls} className={`h-3 w-3 rounded-[3px] ${cls}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Monthly breakdown */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Last 12 months
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {monthBreakdown.map(({ label, completed, total }) => {
            const pct = Math.round((completed / total) * 100)
            return (
              <div key={label} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xs text-slate-400 w-20 shrink-0">{label}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500 tabular-nums w-14 text-right shrink-0">
                  {completed}/{total}d
                </span>
                <span className="text-xs font-semibold text-emerald-600 tabular-nums w-8 text-right shrink-0">
                  {pct}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
