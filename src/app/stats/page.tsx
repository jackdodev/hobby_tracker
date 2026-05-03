export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getDailyCountMap, getActiveHobbies } from '@/lib/storage'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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

export default async function StatsPage() {
  const jar = await cookies()
  const userId = jar.get('userId')?.value ?? ''

  const dailyMap = await getDailyCountMap(userId)
  const totalHobbies = (await getActiveHobbies(userId)).length

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const gridEnd = new Date(today)
  const dayOfWeek = (today.getDay() + 6) % 7
  gridEnd.setDate(today.getDate() + (6 - dayOfWeek))

  const gridStart = new Date(gridEnd)
  gridStart.setDate(gridEnd.getDate() - 52 * 7 + 1)

  type Cell = { date: string; count: number; inFuture: boolean }
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

  const monthPositions: { label: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, col) => {
    const m = new Date(week[0].date + 'T00:00:00').getMonth()
    if (m !== lastMonth) {
      monthPositions.push({ label: MONTH_LABELS[m], col })
      lastMonth = m
    }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-0.5">Stats</h1>
      <p className="text-slate-400 text-sm mb-6">Your activity over the past year.</p>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-0">
          {/* Month labels */}
          <div className="flex mb-1.5 ml-8">
            {weeks.map((_, col) => {
              const label = monthPositions.find((p) => p.col === col)?.label
              return (
                <div key={col} className="w-4 text-[10px] text-slate-400 text-center font-medium">
                  {label ?? ''}
                </div>
              )
            })}
          </div>

          {/* Grid */}
          <div className="flex gap-0.5">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-0.5 mr-1.5">
              {DAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  className={`h-3.5 w-6 text-[10px] text-slate-400 flex items-center justify-end pr-1 font-medium ${
                    i % 2 === 0 ? 'invisible' : ''
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, col) => (
              <div key={col} className="flex flex-col gap-0.5">
                {week.map((cell) => (
                  <div
                    key={cell.date}
                    title={`${cell.date}: ${cell.count} / ${totalHobbies}`}
                    className={`h-3.5 w-4 rounded-sm transition-colors ${
                      cell.inFuture ? 'bg-slate-50' : cellColor(cell.count, totalHobbies)
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3 ml-8 text-xs text-slate-400">
            <span>Less</span>
            {['bg-slate-100', 'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-500', 'bg-emerald-600'].map((cls) => (
              <div key={cls} className={`h-3.5 w-4 rounded-sm ${cls}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-white rounded-2xl shadow-sm border border-slate-200 text-sm text-slate-500">
        Tracking{' '}
        <span className="font-semibold text-slate-700">{totalHobbies}</span>{' '}
        active {totalHobbies === 1 ? 'hobby' : 'hobbies'}. Each cell&apos;s intensity reflects how many were completed that day.
      </div>
    </div>
  )
}
