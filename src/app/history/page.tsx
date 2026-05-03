import { cookies } from 'next/headers'
import { getHobbies, getLogEntriesForMonth } from '@/lib/storage'
import MonthNav from './components/MonthNav'
import type { Hobby } from '@/types'

type Props = {
  searchParams: Promise<{ month?: string }>
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export default async function HistoryPage({ searchParams }: Props) {
  const { month } = await searchParams
  const today = new Date()
  const currentMonth =
    month ?? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const [year, mon] = currentMonth.split('-').map(Number)
  const days = daysInMonth(year, mon)
  const dayNumbers = Array.from({ length: days }, (_, i) => i + 1)

  const jar = await cookies()
  const userId = jar.get('userId')?.value ?? ''

  const hobbies = await getHobbies(userId)
  const entries = await getLogEntriesForMonth(userId, currentMonth)
  const entryMap = new Map(entries.map((e) => [`${e.hobbyId}:${e.date}`, e]))

  const active = hobbies.filter((h) => h.removedAt === null)

  function cellStatus(hobby: Hobby, day: number): 'full' | 'partial' | 'none' {
    const date = `${currentMonth}-${String(day).padStart(2, '0')}`
    const entry = entryMap.get(`${hobby.id}:${date}`)
    if (!entry) return 'none'
    if (hobby.type === 'boolean' || !hobby.goal) return 'full'
    return (entry.value ?? 0) >= hobby.goal.target ? 'full' : 'partial'
  }

  function completionPct(hobby: Hobby): string {
    const count = dayNumbers.filter((d) => cellStatus(hobby, d) === 'full').length
    return `${Math.round((count / days) * 100)}%`
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-0.5">History</h1>
      <p className="text-slate-400 text-sm mb-5">Monthly overview of your hobby achievements.</p>

      <MonthNav current={currentMonth} />

      {hobbies.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-slate-500 text-sm mb-2">No hobbies to show history for.</p>
          <a href="/hobbies" className="text-indigo-500 text-sm font-medium hover:text-indigo-700 transition-colors">
            Add some hobbies
          </a>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
          <table className="text-sm border-collapse w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 font-semibold text-slate-600 sticky left-0 bg-white min-w-[120px] z-10">
                  Hobby
                </th>
                {dayNumbers.map((d) => (
                  <th key={d} className="w-7 text-center font-normal text-slate-400 py-3 text-xs">
                    {d}
                  </th>
                ))}
                <th className="pl-3 pr-4 text-right font-semibold text-slate-600 py-3 min-w-[48px]">%</th>
              </tr>
            </thead>
            <tbody>
              {active.map((hobby) => (
                <tr key={hobby.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-slate-700 text-sm sticky left-0 bg-white z-10">
                    {hobby.name}
                  </td>
                  {dayNumbers.map((d) => {
                    const status = cellStatus(hobby, d)
                    return (
                      <td key={d} className="text-center py-2.5">
                        {status === 'full' && (
                          <span className="inline-flex items-center justify-center w-5 h-5 bg-emerald-100 rounded-md text-emerald-600 text-xs font-bold">
                            ✓
                          </span>
                        )}
                        {status === 'partial' && (
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-500 text-[10px]">
                            ●
                          </span>
                        )}
                      </td>
                    )
                  })}
                  <td className="pl-3 pr-4 text-right py-2.5 font-semibold text-emerald-600 text-sm tabular-nums">
                    {completionPct(hobby)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center gap-4 px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-4 h-4 bg-emerald-100 rounded text-emerald-600 text-[10px] font-bold">✓</span>
              Fully achieved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-amber-100 text-amber-500 text-[9px]">●</span>
              Partially achieved
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
