'use client'

import { useOptimistic, useTransition } from 'react'
import { upsertLog } from '@/actions/log'
import type { StreakInfo } from '@/types'

type Props = {
  hobbyId: string
  hobbyName: string
  date: string
  checked: boolean
  streak: StreakInfo
}

export default function ToggleButton({ hobbyId, hobbyName, date, checked, streak }: Props) {
  const [, startTransition] = useTransition()
  const [optimisticChecked, setOptimisticChecked] = useOptimistic(checked)

  function handleClick() {
    startTransition(async () => {
      setOptimisticChecked(!optimisticChecked)
      await upsertLog(hobbyId, date)
    })
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border text-left transition-colors ${
        optimisticChecked
          ? 'bg-green-50 border-green-300 text-green-800'
          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
          optimisticChecked ? 'bg-green-500 border-green-500' : 'border-gray-300'
        }`}
      >
        {optimisticChecked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className="font-medium flex-1">{hobbyName}</span>
      <StreakBadge streak={streak} />
    </button>
  )
}

export function StreakBadge({ streak }: { streak: StreakInfo }) {
  return (
    <span className="flex items-center gap-2 text-xs shrink-0">
      <span
        title="Current streak"
        className={`flex items-center gap-0.5 font-semibold ${
          streak.current > 0 ? 'text-orange-500' : 'text-gray-300'
        }`}
      >
        🔥 {streak.current}d
      </span>
      <span title="Best streak" className="text-gray-400">
        best {streak.best}d
      </span>
    </span>
  )
}
