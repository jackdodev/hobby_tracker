'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { addHobby, addRoutine, removeRoutine } from '@/lib/storage'
import type { HobbyType, HobbyGoal } from '@/types'

async function getUserId(): Promise<string> {
  const jar = await cookies()
  return jar.get('userId')?.value ?? ''
}

export async function createRoutineWithHobbies(params: {
  routineName: string
  hobbies: Array<{ name: string; type: HobbyType; goal?: HobbyGoal }>
}): Promise<void> {
  if (!params.routineName.trim() || params.hobbies.length === 0) return
  const userId = await getUserId()
  const hobbyIds = await Promise.all(
    params.hobbies.map(async (h) => (await addHobby(userId, h.name, h.type, h.goal)).id)
  )
  await addRoutine(userId, params.routineName, hobbyIds)
  revalidatePath('/')
  revalidatePath('/hobbies')
}

export async function deleteRoutine(id: string): Promise<void> {
  const userId = await getUserId()
  await removeRoutine(userId, id)
  revalidatePath('/')
  revalidatePath('/hobbies')
}
