'use server'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { addHobby, removeHobby, updateHobbyGoal } from '@/lib/storage'
import type { HobbyType, HobbyGoal } from '@/types'

async function getUserId(): Promise<string> {
  const session = await auth()
  const userId = session?.user?.email
  if (!userId) redirect('/login')
  return userId
}

export async function createHobby(params: {
  name: string
  type: HobbyType
  goal?: HobbyGoal
}): Promise<void> {
  if (!params.name.trim()) return
  const userId = await getUserId()
  await addHobby(userId, params.name, params.type, params.goal)
  revalidatePath('/')
  revalidatePath('/hobbies')
  revalidatePath('/history')
}

export async function editHobbyGoal(id: string, goal: { target: number; unit: string }): Promise<void> {
  const userId = await getUserId()
  await updateHobbyGoal(userId, id, goal)
  revalidatePath('/')
  revalidatePath('/hobbies')
}

export async function deleteHobby(id: string): Promise<void> {
  const userId = await getUserId()
  await removeHobby(userId, id)
  revalidatePath('/')
  revalidatePath('/hobbies')
  revalidatePath('/history')
}
