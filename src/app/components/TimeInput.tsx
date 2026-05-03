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
      className={`flex flex-col gap-2.5 w-full px-4 py-3.5 rounded-2xl shadow-sm border transition-all cursor-pointer min-h-[56px] ${
        done
          ? 'bg-emerald-50 border-emerald-200 shadow-emerald-100'
          : 'bg-white border-slate-200 hover:border-slate-300'
      } ${isPending ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3">
        <span className={`font-medium flex-1 text-sm ${done ? 'text-emerald-800' : 'text-slate-700'}`}>
          {hobbyName}
        </span>
        <span className="text-xs text-slate-500 shrink-0 tabular-nums">
          {minutes} / {goal.target} min
        </span>
        <StreakBadge streak={streak} />
      </div>

      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {editing && (
        <form
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleSubmit}
          className="flex flex-wrap items-center gap-2 mt-1"
        >
          <input
            name="start"
            type="time"
            required
            autoFocus
            className="border border-slate-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <span className="text-slate-400 text-sm">to</span>
          <input
            name="end"
            type="time"
            required
            className="border border-slate-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Save
          </button>
        </form>
      )}
    </div>
  )
}
