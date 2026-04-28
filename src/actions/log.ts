'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { upsertLogEntry } from '@/lib/storage'

export async function upsertLog(hobbyId: string, date: string, value?: number): Promise<void> {
  const jar = await cookies()
  const userId = jar.get('userId')?.value ?? ''
  await upsertLogEntry(userId, hobbyId, date, value)
  revalidatePath('/')
}
