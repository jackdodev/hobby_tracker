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

export default function QuantityInput({ hobbyId, hobbyName, date, value: initialValue, goal, streak }: Props) {
  const [current, setCurrent] = useState(initialValue)
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const pct = Math.min(100, Math.round((current / goal.target) * 100))
  const done = current >= goal.target

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const val = Number(fd.get('value'))
    setCurrent(val)
    setEditing(false)
    startTransition(() => upsertLog(hobbyId, date, val))
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
          {current} / {goal.target} {goal.unit}
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
        <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="flex gap-2 mt-1">
          <input
            name="value"
            type="number"
            min="0"
            step="any"
            defaultValue={current || ''}
            placeholder={`Amount in ${goal.unit}`}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
