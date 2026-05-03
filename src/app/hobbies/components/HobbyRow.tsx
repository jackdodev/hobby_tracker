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
  boolean: 'bg-slate-100 text-slate-600',
  counter: 'bg-indigo-100 text-indigo-700',
  quantity: 'bg-cyan-100 text-cyan-700',
  time: 'bg-violet-100 text-violet-700',
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
    <li className={`flex flex-col bg-white ${isPending ? 'opacity-50' : ''}`}>
      <div
        onClick={() => editable && setEditing((v) => !v)}
        className={`flex items-center justify-between px-4 py-3 ${
          editable ? 'cursor-pointer hover:bg-slate-50' : ''
        } ${editing ? 'bg-slate-50' : ''}`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-slate-800">{hobby.name}</span>
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
          className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-t border-slate-100"
        >
          <input
            name="target"
            type="number"
            min="1"
            required
            defaultValue={hobby.goal?.target}
            placeholder="Target"
            autoFocus
            className="w-28 border border-slate-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            name="unit"
            required
            defaultValue={hobby.goal?.unit}
            placeholder="Unit"
            className="w-28 border border-slate-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
        </form>
      )}
    </li>
  )
}
