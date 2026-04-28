export const dynamic = 'force-dynamic'

import { getDailyCountMap, getActiveHobbies } from '@/lib/storage'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function toDateString(d: Date): string {
  return d.toLocaleDateString('en-CA')
}

function cellColor(count: number, total: number): string {
  if (total === 0 || count === 0) return 'bg-gray-100'
  const ratio = count / total
  if (ratio <= 0.25) return 'bg-green-200'
  if (ratio <= 0.5) return 'bg-green-400'
  if (ratio < 1) return 'bg-green-600'
  return 'bg-green-700'
}

export default async function StatsPage() {
  const dailyMap = await getDailyCountMap()
  const totalHobbies = (await getActiveHobbies()).length

  // Build a 52-week grid ending today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start from the most recent Sunday 52 weeks ago
  const gridEnd = new Date(today)
  // Advance to end of this week (Saturday)
  const dayOfWeek = (today.getDay() + 6) % 7 // 0=Mon, 6=Sun
  gridEnd.setDate(today.getDate() + (6 - dayOfWeek))

  const gridStart = new Date(gridEnd)
  gridStart.setDate(gridEnd.getDate() - 52 * 7 + 1)

  // Build weeks: array of 7-day arrays (Mon–Sun)
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

  // Month label positions: find the first week where the month changes
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
      <h1 className="text-2xl font-bold mb-1">Stats</h1>
      <p className="text-gray-500 mb-6">Your activity over the past year.</p>

      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {weeks.map((_, col) => {
              const label = monthPositions.find((p) => p.col === col)?.label
              return (
                <div key={col} className="w-3.5 text-[10px] text-gray-400 text-center">
                  {label ?? ''}
                </div>
              )
            })}
          </div>

          {/* Grid */}
          <div className="flex gap-0.5">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {DAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  className={`h-3 w-6 text-[10px] text-gray-400 flex items-center justify-end pr-1 ${
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
                    className={`h-3 w-3.5 rounded-sm ${
                      cell.inFuture ? 'bg-gray-50' : cellColor(cell.count, totalHobbies)
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3 ml-8 text-xs text-gray-400">
            <span>Less</span>
            {['bg-gray-100', 'bg-green-200', 'bg-green-400', 'bg-green-600', 'bg-green-700'].map((cls) => (
              <div key={cls} className={`h-3 w-3.5 rounded-sm ${cls}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        Tracking <span className="font-medium text-gray-700">{totalHobbies}</span> active{' '}
        {totalHobbies === 1 ? 'hobby' : 'hobbies'}. Each cell intensity = hobbies completed that day.
      </div>
    </div>
  )
}
