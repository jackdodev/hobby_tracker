'use client'

import { useState, useTransition } from 'react'
import { HOBBY_PRESETS, type HobbyPreset } from '@/lib/presets'
import { createRoutineWithHobbies } from '@/actions/routines'
import type { HobbyType, HobbyGoal } from '@/types'

type PendingHobby = { name: string; type: HobbyType; goal?: HobbyGoal }

export default function AddRoutineModal() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [routineName, setRoutineName] = useState('')
  const [pendingHobbies, setPendingHobbies] = useState<PendingHobby[]>([])

  const [selectedPreset, setSelectedPreset] = useState<HobbyPreset | null>(null)
  const [formName, setFormName] = useState('')
  const [customType, setCustomType] = useState<HobbyType>('boolean')
  const [formTarget, setFormTarget] = useState('')
  const [formUnit, setFormUnit] = useState('')

  function resetPicker() {
    setSelectedPreset(null)
    setFormName('')
    setCustomType('boolean')
    setFormTarget('')
    setFormUnit('')
  }

  function close() {
    setOpen(false)
    setRoutineName('')
    setPendingHobbies([])
    resetPicker()
  }

  function handlePresetClick(preset: HobbyPreset) {
    if (preset.type === 'boolean') {
      setPendingHobbies((prev) => [...prev, { name: preset.name, type: 'boolean' }])
      return
    }
    if (selectedPreset?.name === preset.name) {
      resetPicker()
    } else {
      setSelectedPreset(preset)
      setFormName(preset.name)
      setCustomType(preset.type)
      setFormTarget(preset.goal?.target.toString() ?? '')
      setFormUnit(preset.goal?.unit ?? '')
    }
  }

  function handleAddToRoutine(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const name = formName.trim()
    if (!name) return
    const goal = customType !== 'boolean' ? { target: Number(formTarget), unit: formUnit } : undefined
    setPendingHobbies((prev) => [...prev, { name, type: customType, goal }])
    resetPicker()
  }

  function handleCreateRoutine() {
    if (!routineName.trim() || pendingHobbies.length === 0) return
    startTransition(async () => {
      await createRoutineWithHobbies({ routineName: routineName.trim(), hobbies: pendingHobbies })
      close()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2.5 border border-indigo-500 text-indigo-600 text-sm font-medium rounded-xl hover:bg-indigo-50 transition-colors"
      >
        + Add Routine
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-start md:justify-center md:pt-16 md:px-4"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-xl w-full md:max-w-lg p-6 max-h-[90vh] md:max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Create a Routine</h2>
              <button
                onClick={close}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Routine Name
              </p>
              <input
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                placeholder="e.g. Morning Routine"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {pendingHobbies.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  Added Hobbies
                </p>
                <ul className="flex flex-col gap-1.5">
                  {pendingHobbies.map((h, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-sm"
                    >
                      <span className="font-medium text-indigo-800">{h.name}</span>
                      <div className="flex items-center gap-2">
                        {h.goal && (
                          <span className="text-xs text-indigo-400 tabular-nums">
                            {h.goal.target} {h.goal.unit}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setPendingHobbies((prev) => prev.filter((_, j) => j !== i))}
                          className="w-5 h-5 flex items-center justify-center rounded-full text-indigo-400 hover:text-rose-500 hover:bg-rose-50 transition-colors text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Popular habits
            </p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {HOBBY_PRESETS.map((p) => {
                const isSelected = selectedPreset?.name === p.name
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handlePresetClick(p)}
                    disabled={isPending}
                    className={`flex flex-col items-center gap-1 p-3 border rounded-2xl text-sm transition-colors disabled:opacity-50 ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-2xl">{p.emoji}</span>
                    <span className="text-center leading-tight text-xs font-medium">{p.name}</span>
                  </button>
                )
              })}
            </div>

            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                {selectedPreset ? `Customize: ${selectedPreset.name}` : 'Custom hobby'}
              </p>
              <form onSubmit={handleAddToRoutine} className="flex flex-col gap-3">
                <input
                  required
                  placeholder="Hobby name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <select
                  value={customType}
                  onChange={(e) => { setCustomType(e.target.value as HobbyType); setSelectedPreset(null) }}
                  className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                >
                  <option value="boolean">Done / Not done</option>
                  <option value="counter">Counter (e.g. pages read)</option>
                  <option value="quantity">Quantity (e.g. ml of water)</option>
                  <option value="time">Time (e.g. minutes of exercise)</option>
                </select>
                {customType !== 'boolean' && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Daily goal"
                      value={formTarget}
                      onChange={(e) => setFormTarget(e.target.value)}
                      className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <input
                      required
                      placeholder={customType === 'time' ? 'min' : 'unit'}
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-24 border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isPending || !formName.trim()}
                  className="px-4 py-2.5 border border-indigo-500 text-indigo-600 text-sm font-medium rounded-xl hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                >
                  + Add to Routine
                </button>
              </form>
            </div>

            <button
              onClick={handleCreateRoutine}
              disabled={isPending || !routineName.trim() || pendingHobbies.length === 0}
              className="mt-5 w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Creating…' : `Create Routine${pendingHobbies.length > 0 ? ` (${pendingHobbies.length})` : ''}`}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
