'use server'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { upsertLogEntry } from '@/lib/storage'

export async function upsertLog(hobbyId: string, date: string, value?: number): Promise<void> {
  const session = await auth()
  const userId = session?.user?.email
  if (!userId) redirect('/login')
  await upsertLogEntry(userId, hobbyId, date, value)
  revalidatePath('/')
}
