'use client'

import { useState, useTransition } from 'react'
import { deleteHobby } from '@/actions/hobbies'

export default function RemoveButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Remove?</span>
        <button
          onClick={() => startTransition(() => deleteHobby(id))}
          disabled={isPending}
          className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          Yes
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm text-red-500 hover:text-red-700"
    >
      Remove
    </button>
  )
}
