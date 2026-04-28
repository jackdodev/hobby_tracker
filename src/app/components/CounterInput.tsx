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
      className={`flex flex-col gap-2 w-full px-4 py-3 rounded-lg border transition-colors ${
        done ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'
      } ${isPending ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        <span className={`font-medium flex-1 ${done ? 'text-green-800' : 'text-gray-700'}`}>
          {hobbyName}
        </span>
        <span className="text-sm text-gray-500 shrink-0">
          {count} / {goal.target} {goal.unit}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => adjust(-1)}
            disabled={count === 0 || isPending}
            className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 font-medium"
          >
            −
          </button>
          <button
            onClick={() => adjust(1)}
            disabled={isPending}
            className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
          >
            +
          </button>
        </div>
        <StreakBadge streak={streak} />
      </div>

      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
