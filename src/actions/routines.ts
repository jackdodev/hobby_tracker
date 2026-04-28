'use server'

import { revalidatePath } from 'next/cache'
import { addHobby, addRoutine, removeRoutine } from '@/lib/storage'
import type { HobbyType, HobbyGoal } from '@/types'

export async function createRoutineWithHobbies(params: {
  routineName: string
  hobbies: Array<{ name: string; type: HobbyType; goal?: HobbyGoal }>
}): Promise<void> {
  if (!params.routineName.trim() || params.hobbies.length === 0) return
  const hobbyIds = await Promise.all(params.hobbies.map(async (h) => (await addHobby(h.name, h.type, h.goal)).id))
  await addRoutine(params.routineName, hobbyIds)
  revalidatePath('/')
  revalidatePath('/hobbies')
}

export async function deleteRoutine(id: string): Promise<void> {
  await removeRoutine(id)
  revalidatePath('/')
  revalidatePath('/hobbies')
}
