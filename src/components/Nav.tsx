'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/actions/auth'
import {
  HomeIcon as HomeOutline,
  ListBulletIcon as ListOutline,
  CalendarDaysIcon as CalendarOutline,
  ChartBarIcon as ChartOutline,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeSolid,
  ListBulletIcon as ListSolid,
  CalendarDaysIcon as CalendarSolid,
  ChartBarIcon as ChartSolid,
} from '@heroicons/react/24/solid'

const LINKS = [
  { href: '/', label: 'Today', Outline: HomeOutline, Solid: HomeSolid },
  { href: '/hobbies', label: 'Hobbies', Outline: ListOutline, Solid: ListSolid },
  { href: '/history', label: 'History', Outline: CalendarOutline, Solid: CalendarSolid },
  { href: '/stats', label: 'Stats', Outline: ChartOutline, Solid: ChartSolid },
]

type Props = { userId: string }

export default function Nav({ userId }: Props) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop top nav — hidden on mobile */}
      <nav className="hidden md:block border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-1">
          <div className="flex items-center gap-1 flex-1">
            {LINKS.map(({ href, label, Outline, Solid }) => {
              const active = pathname === href
              const Ic = active ? Solid : Outline
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Ic className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{userId}</span>
            <form action={logout}>
              <button
                type="submit"
                className="text-xs text-slate-500 hover:text-rose-500 transition-colors"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar — hidden on desktop */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-40">
        <div className="flex items-center justify-around px-2 pt-2 pb-3">
          {LINKS.map(({ href, label, Outline, Solid }) => {
            const active = pathname === href
            const Ic = active ? Solid : Outline
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl min-w-[56px] transition-colors ${
                  active ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <Ic className="w-6 h-6" />
                <span className="text-[11px] font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
