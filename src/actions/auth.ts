'use server'

import { signOut } from '@/auth'
import { createUser } from '@/lib/storage'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

export async function logout(): Promise<void> {
  await signOut({ redirectTo: '/login' })
}

export async function signup(formData: FormData): Promise<void> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const username = (formData.get('username') as string)?.trim()
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!email) redirect('/signup?error=email_required')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect('/signup?error=invalid_email')
  if (!username) redirect('/signup?error=username_required')
  if (password.length < 8) redirect('/signup?error=password_too_short')
  if (password !== confirm) redirect('/signup?error=passwords_mismatch')

  const passwordHash = await bcrypt.hash(password, 10)
  try {
    await createUser(email, username, passwordHash)
  } catch {
    redirect('/signup?error=email_taken')
  }

  redirect('/login?signup=success')
}
