'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

const NAV_LINKS = [
  { href: '/', label: 'Today', Outline: HomeOutline, Solid: HomeSolid },
  { href: '/hobbies', label: 'Hobbies', Outline: ListOutline, Solid: ListSolid },
  { href: '/history', label: 'History', Outline: CalendarOutline, Solid: CalendarSolid },
  { href: '/stats', label: 'Stats', Outline: ChartOutline, Solid: ChartSolid },
]

function getInitials(userId: string): string {
  const name = userId.split('@')[0]
  return name.slice(0, 2).toUpperCase()
}

type Props = { userId: string }

export default function Nav({ userId }: Props) {
  const pathname = usePathname()
  const initials = getInitials(userId)
  const accountActive = pathname === '/account'

  return (
    <>
      {/* Desktop top nav — hidden on mobile */}
      <nav className="hidden md:block border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-1">
          <div className="flex items-center gap-1 flex-1">
            {NAV_LINKS.map(({ href, label, Outline, Solid }) => {
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

          <Link
            href="/account"
            title={userId}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              accountActive
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
            }`}
          >
            {initials}
          </Link>
        </div>
      </nav>

      {/* Mobile bottom tab bar — hidden on desktop */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-40">
        <div className="flex items-center justify-around px-2 pt-2 pb-3">
          {NAV_LINKS.map(({ href, label, Outline, Solid }) => {
            const active = pathname === href
            const Ic = active ? Solid : Outline
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl min-w-[52px] transition-colors ${
                  active ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <Ic className="w-6 h-6" />
                <span className="text-[11px] font-medium">{label}</span>
              </Link>
            )
          })}

          {/* Avatar tab */}
          <Link
            href="/account"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl min-w-[52px] transition-colors ${
              accountActive ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                accountActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {initials}
            </span>
            <span className="text-[11px] font-medium">Account</span>
          </Link>
        </div>
      </nav>
    </>
  )
}
