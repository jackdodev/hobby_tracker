'use client'

import { useState, useTransition } from 'react'
import { deleteRoutine } from '@/actions/routines'
import type { Hobby, Routine } from '@/types'

type Props = {
  routine: Routine
  hobbies: Hobby[]
}

export default function RoutineRow({ routine, hobbies }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <li className={`flex items-center justify-between px-4 py-3 bg-white ${isPending ? 'opacity-50' : ''}`}>
      <div className="flex flex-col gap-0.5 min-w-0 mr-4">
        <span className="font-medium text-sm text-slate-800">{routine.name}</span>
        <span className="text-xs text-slate-400 truncate">
          {hobbies.length === 0
            ? 'No active hobbies'
            : hobbies.map((h) => h.name).join(' · ')}
        </span>
      </div>

      {confirming ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-slate-500">Remove?</span>
          <button
            onClick={() => startTransition(() => deleteRoutine(routine.id))}
            disabled={isPending}
            className="text-sm font-medium text-rose-600 hover:text-rose-800 disabled:opacity-50 transition-colors"
          >
            Yes
          </button>
          <button onClick={() => setConfirming(false)} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            No
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="text-sm text-rose-500 hover:text-rose-700 shrink-0 transition-colors"
        >
          Remove
        </button>
      )}
    </li>
  )
}
