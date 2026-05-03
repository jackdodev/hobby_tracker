import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import Nav from '@/components/Nav'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hobby Tracker',
  description: 'Track your daily hobby achievements',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies()
  const userId = jar.get('userId')?.value ?? ''

  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {userId && <Nav userId={userId} />}
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 pb-24 md:py-8 md:pb-8">
          {children}
        </main>
      </body>
    </html>
  )
}
