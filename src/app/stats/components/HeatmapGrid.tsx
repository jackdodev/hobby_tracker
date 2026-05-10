export type Cell = { date: string; count: number; inFuture: boolean }

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const LEGEND_CELLS = [
  'bg-slate-100',
  'bg-emerald-200',
  'bg-emerald-400',
  'bg-emerald-500',
  'bg-emerald-600',
]

export function cellColor(count: number, total: number): string {
  if (total === 0 || count === 0) return 'bg-slate-100'
  const ratio = count / total
  if (ratio <= 0.25) return 'bg-emerald-200'
  if (ratio <= 0.5) return 'bg-emerald-400'
  if (ratio < 1) return 'bg-emerald-500'
  return 'bg-emerald-600'
}

type HeatmapGridProps = {
  weeks: Cell[][]
  totalHobbies: number
  getTitle?: (cell: Cell) => string
}

export function HeatmapGrid({ weeks, totalHobbies, getTitle }: HeatmapGridProps) {
  // Month label positions
  const monthLabels: { label: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, col) => {
    const m = new Date(week[0].date + 'T00:00:00').getMonth()
    if (m !== lastMonth) {
      monthLabels.push({ label: MONTH_LABELS[m], col })
      lastMonth = m
    }
  })

  const defaultTitle = (cell: Cell) => `${cell.date}: ${cell.count} / ${totalHobbies}`
  const titleFn = getTitle ?? defaultTitle

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1 min-w-max">
        {/* Month labels */}
        <div className="flex gap-[3px] pl-8">
          {weeks.map((week, col) => {
            const entry = monthLabels.find((p) => p.col === col)
            return (
              <div key={col} className="w-3 relative">
                {entry && (
                  <span className="absolute text-[9px] text-slate-400 font-medium whitespace-nowrap">
                    {entry.label}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Grid */}
        <div className="flex gap-[3px] mt-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] w-7 shrink-0">
            {DAY_LABELS.map((label, i) => (
              <div
                key={label}
                className={`h-3 text-[9px] text-slate-400 flex items-center justify-end pr-1 font-medium ${
                  i % 2 === 0 ? 'invisible' : ''
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, col) => (
            <div key={col} className="flex flex-col gap-[3px]">
              {week.map((cell) => (
                <div
                  key={cell.date}
                  title={titleFn(cell)}
                  className={`w-3 h-3 rounded-[3px] transition-colors ${
                    cell.inFuture ? 'bg-slate-50' : cellColor(cell.count, totalHobbies)
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
