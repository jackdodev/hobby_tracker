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
      <h1 className="text-2xl font-bold mb-1">History</h1>
      <p className="text-gray-500 mb-4">Monthly overview of your hobby achievements.</p>

      <MonthNav current={currentMonth} />

      {hobbies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">No hobbies to show history for.</p>
          <a href="/hobbies" className="text-blue-500 text-sm underline">Add some hobbies</a>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse w-full">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 font-medium text-gray-600 sticky left-0 bg-white min-w-[120px]">
                  Hobby
                </th>
                {dayNumbers.map((d) => (
                  <th key={d} className="w-7 text-center font-normal text-gray-400 pb-2">
                    {d}
                  </th>
                ))}
                <th className="pl-3 text-right font-medium text-gray-600 pb-2 min-w-[48px]">%</th>
              </tr>
            </thead>
            <tbody>
              {active.map((hobby) => (
                <tr key={hobby.id} className="border-t border-gray-100">
                  <td className="py-2 pr-4 font-medium sticky left-0 bg-white">{hobby.name}</td>
                  {dayNumbers.map((d) => {
                    const status = cellStatus(hobby, d)
                    return (
                      <td key={d} className="text-center py-2">
                        {status === 'full' && <span className="text-green-500 text-base">✓</span>}
                        {status === 'partial' && <span className="text-orange-400 text-base">●</span>}
                      </td>
                    )
                  })}
                  <td className="pl-3 text-right py-2 font-medium text-green-600">
                    {completionPct(hobby)}
                  </td>
                </tr>
              ))}

            </tbody>
          </table>

          <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="text-green-500">✓</span> Fully achieved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-orange-400">●</span> Partially achieved
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
