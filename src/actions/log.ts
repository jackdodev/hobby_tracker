'use server'

import { revalidatePath } from 'next/cache'
import { upsertLogEntry } from '@/lib/storage'

export async function upsertLog(hobbyId: string, date: string, value?: number): Promise<void> {
  upsertLogEntry(hobbyId, date, value)
  revalidatePath('/')
}
