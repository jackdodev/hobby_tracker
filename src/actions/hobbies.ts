'use server'

import { revalidatePath } from 'next/cache'
import { addHobby, removeHobby, updateHobbyGoal } from '@/lib/storage'
import type { HobbyType, HobbyGoal } from '@/types'

export async function createHobby(params: {
  name: string
  type: HobbyType
  goal?: HobbyGoal
}): Promise<void> {
  if (!params.name.trim()) return
  await addHobby(params.name, params.type, params.goal)
  revalidatePath('/')
  revalidatePath('/hobbies')
  revalidatePath('/history')
}

export async function editHobbyGoal(id: string, goal: { target: number; unit: string }): Promise<void> {
  await updateHobbyGoal(id, goal)
  revalidatePath('/')
  revalidatePath('/hobbies')
}

export async function deleteHobby(id: string): Promise<void> {
  await removeHobby(id)
  revalidatePath('/')
  revalidatePath('/hobbies')
  revalidatePath('/history')
}
