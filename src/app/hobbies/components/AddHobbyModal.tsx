'use client'

import { useState, useTransition } from 'react'
import { HOBBY_PRESETS, type HobbyPreset } from '@/lib/presets'
import { createHobby } from '@/actions/hobbies'
import type { HobbyType } from '@/types'

export default function AddHobbyModal() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Controlled form state
  const [selectedPreset, setSelectedPreset] = useState<HobbyPreset | null>(null)
  const [formName, setFormName] = useState('')
  const [customType, setCustomType] = useState<HobbyType>('boolean')
  const [formTarget, setFormTarget] = useState('')
  const [formUnit, setFormUnit] = useState('')

  function resetForm() {
    setSelectedPreset(null)
    setFormName('')
    setCustomType('boolean')
    setFormTarget('')
    setFormUnit('')
  }

  function close() {
    setOpen(false)
    resetForm()
  }

  function handlePresetClick(preset: HobbyPreset) {
    if (preset.type === 'boolean') {
      // Boolean presets add immediately — no config needed
      startTransition(async () => {
        await createHobby({ name: preset.name, type: preset.type })
        close()
      })
      return
    }

    if (selectedPreset?.name === preset.name) {
      // Clicking the active preset cancels the selection
      resetForm()
    } else {
      // Pre-fill the custom form with this preset's values
      setSelectedPreset(preset)
      setFormName(preset.name)
      setCustomType(preset.type)
      setFormTarget(preset.goal?.target.toString() ?? '')
      setFormUnit(preset.goal?.unit ?? '')
    }
  }

  function handleCustomSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const name = formName.trim()
    if (!name) return
    const goal =
      customType !== 'boolean'
        ? { target: Number(formTarget), unit: formUnit }
        : undefined
    startTransition(async () => {
      await createHobby({ name, type: customType, goal })
      close()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
      >
        + Add hobby
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 pt-16 px-4"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold">Add a hobby</h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
                ✕
              </button>
            </div>

            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Popular habits
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
              {HOBBY_PRESETS.map((p) => {
                const isSelected = selectedPreset?.name === p.name
                return (
                  <button
                    key={p.name}
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
              <form onSubmit={handleCustomSubmit} className="flex flex-col gap-3">
                <input
                  name="name"
                  required
                  placeholder="Hobby name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <select
                  name="type"
                  value={customType}
                  onChange={(e) => {
                    setCustomType(e.target.value as HobbyType)
                    setSelectedPreset(null)
                  }}
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
                      name="target"
                      type="number"
                      min="1"
                      required
                      placeholder="Daily goal (number)"
                      value={formTarget}
                      onChange={(e) => setFormTarget(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <input
                      name="unit"
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
                  disabled={isPending}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending ? 'Adding…' : 'Add hobby'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
