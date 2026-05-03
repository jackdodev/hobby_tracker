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
      className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl shadow-sm border transition-all text-left min-h-[56px] ${
        optimisticChecked
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-100'
          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <span
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          optimisticChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
        }`}
      >
        {optimisticChecked && (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className="font-medium flex-1 text-sm">{hobbyName}</span>
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
          streak.current > 0 ? 'text-amber-500' : 'text-slate-300'
        }`}
      >
        🔥 {streak.current}d
      </span>
      <span title="Best streak" className="text-slate-400">
        best {streak.best}d
      </span>
    </span>
  )
}
