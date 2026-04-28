'use client'

import { useState, useTransition } from 'react'
import { editHobbyGoal } from '@/actions/hobbies'
import RemoveButton from './RemoveButton'
import type { Hobby, HobbyType } from '@/types'

const TYPE_LABEL: Record<HobbyType, string> = {
  boolean: 'Done/Not done',
  counter: 'Counter',
  quantity: 'Quantity',
  time: 'Time',
}

const TYPE_COLOR: Record<HobbyType, string> = {
  boolean: 'bg-gray-100 text-gray-600',
  counter: 'bg-blue-100 text-blue-700',
  quantity: 'bg-cyan-100 text-cyan-700',
  time: 'bg-purple-100 text-purple-700',
}

export default function HobbyRow({ hobby }: { hobby: Hobby }) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const editable = hobby.type !== 'boolean'

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const target = Number(fd.get('target'))
    const unit = fd.get('unit') as string
    startTransition(async () => {
      await editHobbyGoal(hobby.id, { target, unit })
      setEditing(false)
    })
  }

  return (
    <li className={`flex flex-col divide-y divide-gray-100 bg-white ${isPending ? 'opacity-50' : ''}`}>
      <div
        onClick={() => editable && setEditing((v) => !v)}
        className={`flex items-center justify-between px-4 py-3 ${
          editable ? 'cursor-pointer hover:bg-gray-50' : ''
        } ${editing ? 'bg-gray-50' : ''}`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{hobby.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[hobby.type]}`}>
            {TYPE_LABEL[hobby.type]}
            {hobby.goal ? ` · ${hobby.goal.target} ${hobby.goal.unit}` : ''}
          </span>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <RemoveButton id={hobby.id} />
        </div>
      </div>

      {editing && (
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-4 py-3 bg-gray-50"
        >
          <input
            name="target"
            type="number"
            min="1"
            required
            defaultValue={hobby.goal?.target}
            placeholder="Target"
            className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            name="unit"
            required
            defaultValue={hobby.goal?.unit}
            placeholder="Unit"
            className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </form>
      )}
    </li>
  )
}
