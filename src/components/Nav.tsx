'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/actions/auth'

const LINKS = [
  { href: '/', label: 'Today' },
  { href: '/hobbies', label: 'Hobbies' },
  { href: '/history', label: 'History' },
  { href: '/stats', label: 'Stats' },
]

type Props = { userId: string }

export default function Nav({ userId }: Props) {
  const pathname = usePathname()

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-6">
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`text-sm font-medium pb-0.5 transition-colors ${
              pathname === href
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {label}
          </Link>
        ))}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-gray-400">{userId}</span>
          <form action={logout}>
            <button
              type="submit"
              className="text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </nav>
  )
}
