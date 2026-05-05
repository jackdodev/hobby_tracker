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
  { href: '/record', label: 'Record', Outline: CalendarOutline, Solid: CalendarSolid },
  { href: '/stats', label: 'Stats', Outline: ChartOutline, Solid: ChartSolid },
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

type Props = { userName: string; userImage: string | null }

function Avatar({ userName, userImage, size }: Props & { size: 'sm' | 'lg' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-6 h-6 text-[11px]'
  if (userImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={userImage} alt={userName} className={`${dim} rounded-full object-cover`} />
    )
  }
  return <span className={`${dim} rounded-full flex items-center justify-center font-bold`}>{getInitials(userName)}</span>
}

export default function Nav({ userName, userImage }: Props) {
  const pathname = usePathname()
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
            title={userName}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors overflow-hidden ${
              accountActive
                ? 'ring-2 ring-indigo-600'
                : 'ring-2 ring-transparent hover:ring-indigo-300'
            } ${!userImage ? (accountActive ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200') : ''}`}
          >
            <Avatar userName={userName} userImage={userImage} size="sm" />
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
              className={`overflow-hidden transition-colors ${
                accountActive && !userImage ? 'bg-indigo-600 text-white' : (!userImage ? 'bg-slate-200 text-slate-500' : '')
              }`}
            >
              <Avatar userName={userName} userImage={userImage} size="lg" />
            </span>
            <span className="text-[11px] font-medium">Account</span>
          </Link>
        </div>
      </nav>
    </>
  )
}
