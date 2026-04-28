'use client'

import { useState, useTransition } from 'react'
import { upsertLog } from '@/actions/log'
import { StreakBadge } from '@/app/components/ToggleButton'
import type { HobbyGoal, StreakInfo } from '@/types'

type Props = {
  hobbyId: string
  hobbyName: string
  date: string
  value: number // minutes elapsed
  goal: HobbyGoal
  streak: StreakInfo
}

function computeMinutes(start: string, end: string): number {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(0, eh * 60 + em - (sh * 60 + sm))
}

export default function TimeInput({ hobbyId, hobbyName, date, value: initialValue, goal, streak }: Props) {
  const [minutes, setMinutes] = useState(initialValue)
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const pct = Math.min(100, Math.round((minutes / goal.target) * 100))
  const done = minutes >= goal.target

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const elapsed = computeMinutes(fd.get('start') as string, fd.get('end') as string)
    setMinutes(elapsed)
    setEditing(false)
    startTransition(() => upsertLog(hobbyId, date, elapsed))
  }

  return (
    <div
      onClick={() => setEditing((v) => !v)}
      className={`flex flex-col gap-2 w-full px-4 py-3 rounded-lg border transition-colors cursor-pointer ${
        done ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200 hover:bg-gray-50'
      } ${isPending ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        <span className={`font-medium flex-1 ${done ? 'text-green-800' : 'text-gray-700'}`}>
          {hobbyName}
        </span>
        <span className="text-sm text-gray-500 shrink-0">
          {minutes} / {goal.target} min
        </span>
        <StreakBadge streak={streak} />
      </div>

      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {editing && (
        <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 mt-1">
          <input
            name="start"
            type="time"
            required
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            name="end"
            type="time"
            required
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Save
          </button>
        </form>
      )}
    </div>
  )
}
