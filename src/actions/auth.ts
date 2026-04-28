'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData: FormData): Promise<void> {
  const userId = (formData.get('userId') as string).trim()
  if (!userId) return
  const jar = await cookies()
  jar.set('userId', userId, { path: '/', httpOnly: true })
  redirect('/')
}

export async function signup(): Promise<void> {
  redirect('/login')
}

export async function logout(): Promise<void> {
  const jar = await cookies()
  jar.delete('userId')
  redirect('/login')
}
