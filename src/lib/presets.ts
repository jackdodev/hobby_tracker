import type { HobbyType, HobbyGoal } from '@/types'

export type HobbyPreset = {
  name: string
  emoji: string
  type: HobbyType
  goal?: HobbyGoal
}

export const HOBBY_PRESETS: HobbyPreset[] = [
  { name: 'Meditation', emoji: '🧘', type: 'time', goal: { target: 10, unit: 'min' } },
  { name: 'Reading', emoji: '📚', type: 'counter', goal: { target: 20, unit: 'pages' } },
  { name: 'Drink Water', emoji: '💧', type: 'quantity', goal: { target: 2000, unit: 'ml' } },
  { name: 'Exercise', emoji: '🏋️', type: 'time', goal: { target: 60, unit: 'min' } },
  { name: 'Running', emoji: '🏃', type: 'time', goal: { target: 30, unit: 'min' } },
  { name: 'Journaling', emoji: '📝', type: 'boolean' },
  { name: 'Cold Shower', emoji: '🚿', type: 'boolean' },
  { name: 'Coding', emoji: '💻', type: 'time', goal: { target: 120, unit: 'min' } },
  { name: 'Stretching', emoji: '🤸', type: 'time', goal: { target: 15, unit: 'min' } },
  { name: 'Walking', emoji: '🚶', type: 'time', goal: { target: 30, unit: 'min' } },
  { name: 'Sleep Early', emoji: '😴', type: 'boolean' },
  { name: 'No Social Media', emoji: '📵', type: 'boolean' },
]
