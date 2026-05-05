import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { auth } from '@/auth'
import './globals.css'
import Nav from '@/components/Nav'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hobby Tracker',
  description: 'Track your daily hobby achievements',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user

  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {user && <Nav userName={user.name ?? user.email ?? ''} userImage={user.image ?? null} />}
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 pb-24 md:py-8 md:pb-8">
          {children}
        </main>
      </body>
    </html>
  )
}
