'use client'

import { useState, useTransition } from 'react'
import { deleteHobby } from '@/actions/hobbies'

export default function RemoveButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Remove?</span>
        <button
          onClick={() => startTransition(() => deleteHobby(id))}
          disabled={isPending}
          className="text-sm font-medium text-rose-600 hover:text-rose-800 disabled:opacity-50 transition-colors"
        >
          Yes
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm text-rose-500 hover:text-rose-700 transition-colors"
    >
      Remove
    </button>
  )
}
