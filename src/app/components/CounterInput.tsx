'use client'

import { useState, useTransition } from 'react'
import { upsertLog } from '@/actions/log'
import { StreakBadge } from '@/app/components/ToggleButton'
import type { HobbyGoal, StreakInfo } from '@/types'

type Props = {
  hobbyId: string
  hobbyName: string
  date: string
  value: number
  goal: HobbyGoal
  streak: StreakInfo
}

export default function CounterInput({ hobbyId, hobbyName, date, value: initialValue, goal, streak }: Props) {
  const [count, setCount] = useState(initialValue)
  const [isPending, startTransition] = useTransition()
  const pct = Math.min(100, Math.round((count / goal.target) * 100))
  const done = count >= goal.target

  function adjust(delta: number) {
    const next = Math.max(0, count + delta)
    setCount(next)
    startTransition(() => upsertLog(hobbyId, date, next))
  }

  return (
    <div
      className={`flex flex-col gap-2.5 w-full px-4 py-3.5 rounded-2xl shadow-sm border transition-all ${
        done
          ? 'bg-emerald-50 border-emerald-200 shadow-emerald-100'
          : 'bg-white border-slate-200'
      } ${isPending ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3 min-h-[32px]">
        <span className={`font-medium flex-1 text-sm ${done ? 'text-emerald-800' : 'text-slate-700'}`}>
          {hobbyName}
        </span>
        <span className="text-xs text-slate-500 shrink-0 tabular-nums">
          {count} / {goal.target} {goal.unit}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => adjust(-1)}
            disabled={count === 0 || isPending}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 font-semibold text-lg flex items-center justify-center transition-colors"
          >
            −
          </button>
          <button
            onClick={() => adjust(1)}
            disabled={isPending}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-semibold text-lg flex items-center justify-center transition-colors"
          >
            +
          </button>
        </div>
        <StreakBadge streak={streak} />
      </div>

      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
