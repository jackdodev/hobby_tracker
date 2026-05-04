export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getDailyCountMap, getActiveHobbies, getAllLogEntries } from '@/lib/storage'
import { offsetDate, streakFromDateSet, buildCompletionMap } from '@/lib/utils'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LEGEND_CELLS = ['bg-slate-100', 'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-500', 'bg-emerald-600']

type Cell = { date: string; count: number; inFuture: boolean }

function toDateString(d: Date): string {
  return d.toLocaleDateString('en-CA')
}

function cellColor(count: number, total: number): string {
  if (total === 0 || count === 0) return 'bg-slate-100'
  const ratio = count / total
  if (ratio <= 0.25) return 'bg-emerald-200'
  if (ratio <= 0.5) return 'bg-emerald-400'
  if (ratio < 1) return 'bg-emerald-500'
  return 'bg-emerald-600'
}

function getMonthPositions(weeks: Cell[][]): { label: string; col: number }[] {
  const positions: { label: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, col) => {
    const m = new Date(week[0].date + 'T00:00:00').getMonth()
    if (m !== lastMonth) {
      positions.push({ label: MONTH_LABELS[m], col })
      lastMonth = m
    }
  })
  return positions
}

function HeatmapGrid({ weeks, totalHobbies }: { weeks: Cell[][]; totalHobbies: number }) {
  const monthPositions = getMonthPositions(weeks)

  return (
    <div>
      <div className="flex gap-2 mb-1.5">
        <div className="shrink-0 w-7" />
        {weeks.map((_, col) => {
          const label = monthPositions.find((p) => p.col === col)?.label
          return (
            <div key={col} className="flex-1 text-[10px] text-slate-400 text-center font-medium">
              {label ?? ''}
            </div>
          )
        })}
      </div>

      <div className="flex gap-2">
        <div className="shrink-0 flex flex-col gap-2">
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={`h-10 w-7 text-[10px] text-slate-400 flex items-center justify-end pr-1.5 font-medium ${i % 2 === 0 ? 'invisible' : ''}`}
            >
              {label}
            </div>
          ))}
        </div>

        {weeks.map((week, col) => (
          <div key={col} className="flex-1 flex flex-col gap-2">
            {week.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date}: ${cell.count} / ${totalHobbies}`}
                className={`h-10 w-full rounded-lg transition-colors ${
                  cell.inFuture ? 'bg-slate-50' : cellColor(cell.count, totalHobbies)
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function StatsPage() {
  const jar = await cookies()
  const userId = jar.get('userId')?.value ?? ''

  const [dailyMap, activeHobbies, allEntries] = await Promise.all([
    getDailyCountMap(userId),
    getActiveHobbies(userId),
    getAllLogEntries(userId),
  ])

  const totalHobbies = activeHobbies.length

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toDateString(today)

  const gridEnd = new Date(today)
  const dayOfWeek = (today.getDay() + 6) % 7
  gridEnd.setDate(today.getDate() + (6 - dayOfWeek))

  const gridStart = new Date(gridEnd)
  gridStart.setDate(gridEnd.getDate() - 12 * 7 + 1)

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

  // Last 30 days for sparklines
  const last30 = Array.from({ length: 30 }, (_, i) =>
    offsetDate(todayStr, i - 29)
  )

  const completionMap = buildCompletionMap(activeHobbies, allEntries)

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-0.5">Stats</h1>
      <p className="text-slate-400 text-sm mb-6">Your activity over the past 12 weeks.</p>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <HeatmapGrid weeks={weeks} totalHobbies={totalHobbies} />
        <div className="flex items-center gap-1.5 mt-3 ml-9 text-xs text-slate-400">
          <span>Less</span>
          {LEGEND_CELLS.map((cls) => (
            <div key={cls} className={`h-3.5 w-4 rounded-sm ${cls}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="mt-6 p-4 bg-white rounded-2xl shadow-sm border border-slate-200 text-sm text-slate-500">
        Tracking{' '}
        <span className="font-semibold text-slate-700">{totalHobbies}</span>{' '}
        active {totalHobbies === 1 ? 'hobby' : 'hobbies'}. Each cell&apos;s intensity reflects how many were completed that day.
      </div>

      {activeHobbies.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
            Streak Timeline
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            {activeHobbies.map((hobby) => {
              const completed = completionMap.get(hobby.id) ?? new Set<string>()
              const streak = streakFromDateSet(completed, todayStr)
              return (
                <div key={hobby.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">{hobby.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-emerald-600">
                        🔥 {streak.current}d
                      </span>
                      <span className="text-xs text-slate-400">best {streak.best}d</span>
                    </div>
                  </div>
                  <div className="flex gap-[3px]">
                    {last30.map((date) => (
                      <div
                        key={date}
                        title={date}
                        className={`flex-1 h-5 rounded-[3px] ${
                          completed.has(date) ? 'bg-emerald-500' : 'bg-slate-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
