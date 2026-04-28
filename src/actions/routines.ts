'use server'

import { revalidatePath } from 'next/cache'
import { addHobby, addRoutine, removeRoutine } from '@/lib/storage'
import type { HobbyType, HobbyGoal } from '@/types'

export async function createRoutineWithHobbies(params: {
  routineName: string
  hobbies: Array<{ name: string; type: HobbyType; goal?: HobbyGoal }>
}): Promise<void> {
  if (!params.routineName.trim() || params.hobbies.length === 0) return
  const hobbyIds = params.hobbies.map((h) => addHobby(h.name, h.type, h.goal).id)
  addRoutine(params.routineName, hobbyIds)
  revalidatePath('/')
  revalidatePath('/hobbies')
}

export async function deleteRoutine(id: string): Promise<void> {
  removeRoutine(id)
  revalidatePath('/')
  revalidatePath('/hobbies')
}
