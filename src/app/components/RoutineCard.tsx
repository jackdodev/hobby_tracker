'use client'

import { useState } from 'react'
import ToggleButton, { StreakBadge } from '@/app/components/ToggleButton'
import CounterInput from '@/app/components/CounterInput'
import QuantityInput from '@/app/components/QuantityInput'
import TimeInput from '@/app/components/TimeInput'
import type { Hobby, LogEntry, Routine, StreakInfo } from '@/types'

type Props = {
  routine: Routine
  hobbies: Hobby[]
  entries: LogEntry[]
  today: string
  streaks: Record<string, StreakInfo>
  routineStreak: StreakInfo
}

function isHobbyDone(hobby: Hobby, entry: LogEntry | undefined): boolean {
  if (!entry) return false
  if (hobby.type === 'boolean') return true
  return (entry.value ?? 0) >= (hobby.goal?.target ?? 1)
}

function HobbyItem({
  hobby,
  entry,
  today,
  streak,
}: {
  hobby: Hobby
  entry: LogEntry | undefined
  today: string
  streak: StreakInfo
}) {
  if (hobby.type === 'counter' && hobby.goal)
    return <CounterInput hobbyId={hobby.id} hobbyName={hobby.name} date={today} value={entry?.value ?? 0} goal={hobby.goal} streak={streak} />
  if (hobby.type === 'quantity' && hobby.goal)
    return <QuantityInput hobbyId={hobby.id} hobbyName={hobby.name} date={today} value={entry?.value ?? 0} goal={hobby.goal} streak={streak} />
  if (hobby.type === 'time' && hobby.goal)
    return <TimeInput hobbyId={hobby.id} hobbyName={hobby.name} date={today} value={entry?.value ?? 0} goal={hobby.goal} streak={streak} />
  return <ToggleButton hobbyId={hobby.id} hobbyName={hobby.name} date={today} checked={!!entry} streak={streak} />
}

export default function RoutineCard({ routine, hobbies, entries, today, streaks, routineStreak }: Props) {
  const [expanded, setExpanded] = useState(false)
  const entryMap = new Map(entries.map((e) => [e.hobbyId, e]))

  const doneCount = hobbies.filter((h) => isHobbyDone(h, entryMap.get(h.id))).length
  const allDone = hobbies.length > 0 && doneCount === hobbies.length

  return (
    <div
      className={`rounded-2xl shadow-sm border overflow-hidden transition-all ${
        allDone ? 'border-emerald-200 shadow-emerald-100' : 'border-slate-200'
      }`}
    >
      <div
        onClick={() => setExpanded((v) => !v)}
        className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none min-h-[56px] transition-colors ${
          allDone ? 'bg-emerald-50' : 'bg-white hover:bg-slate-50'
        }`}
      >
        <span className={`font-medium flex-1 text-sm ${allDone ? 'text-emerald-800' : 'text-slate-700'}`}>
          {routine.name}
        </span>
        <span className={`text-xs font-medium shrink-0 tabular-nums ${allDone ? 'text-emerald-600' : 'text-slate-500'}`}>
          {doneCount} / {hobbies.length}
        </span>
        <StreakBadge streak={routineStreak} />
        <span className={`text-[10px] ml-1 shrink-0 ${allDone ? 'text-emerald-400' : 'text-slate-300'}`}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 p-3 flex flex-col gap-2">
          {hobbies.length === 0 ? (
            <p className="text-sm text-slate-400 px-2 py-1">No active hobbies in this routine.</p>
          ) : (
            hobbies.map((hobby) => (
              <HobbyItem
                key={hobby.id}
                hobby={hobby}
                entry={entryMap.get(hobby.id)}
                today={today}
                streak={streaks[hobby.id] ?? { current: 0, best: 0 }}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
