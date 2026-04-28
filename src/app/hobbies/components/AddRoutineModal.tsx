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
        className="px-4 py-2 border border-blue-600 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50"
      >
        + Add Routine
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 pt-16 px-4"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold">Create a Routine</h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
                ✕
              </button>
            </div>

            <div className="mb-5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Routine Name
              </p>
              <input
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                placeholder="e.g. Morning Routine"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {pendingHobbies.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Added Hobbies
                </p>
                <ul className="flex flex-col gap-1">
                  {pendingHobbies.map((h, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm"
                    >
                      <span className="font-medium text-blue-800">{h.name}</span>
                      <div className="flex items-center gap-2">
                        {h.goal && (
                          <span className="text-xs text-blue-500">
                            {h.goal.target} {h.goal.unit}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setPendingHobbies((prev) => prev.filter((_, j) => j !== i))}
                          className="text-blue-400 hover:text-red-500 leading-none"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Popular habits
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
              {HOBBY_PRESETS.map((p) => {
                const isSelected = selectedPreset?.name === p.name
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handlePresetClick(p)}
                    disabled={isPending}
                    className={`flex flex-col items-center gap-1 p-3 border rounded-xl text-sm transition-colors disabled:opacity-50 ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{p.emoji}</span>
                    <span className="text-center leading-tight">{p.name}</span>
                  </button>
                )
              })}
            </div>

            <div className="border-t pt-5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                {selectedPreset ? `Customize: ${selectedPreset.name}` : 'Custom hobby'}
              </p>
              <form onSubmit={handleAddToRoutine} className="flex flex-col gap-3">
                <input
                  required
                  placeholder="Hobby name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <select
                  value={customType}
                  onChange={(e) => { setCustomType(e.target.value as HobbyType); setSelectedPreset(null) }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                      placeholder="Daily goal (number)"
                      value={formTarget}
                      onChange={(e) => setFormTarget(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <input
                      required
                      placeholder={customType === 'time' ? 'min' : 'unit (e.g. ml)'}
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isPending || !formName.trim()}
                  className="px-4 py-2 border border-blue-600 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 disabled:opacity-50"
                >
                  + Add to Routine
                </button>
              </form>
            </div>

            <button
              onClick={handleCreateRoutine}
              disabled={isPending || !routineName.trim() || pendingHobbies.length === 0}
              className="mt-5 w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Creating…' : `Create Routine${pendingHobbies.length > 0 ? ` (${pendingHobbies.length})` : ''}`}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
