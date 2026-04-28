'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/', label: 'Today' },
  { href: '/hobbies', label: 'Hobbies' },
  { href: '/history', label: 'History' },
  { href: '/stats', label: 'Stats' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-3xl mx-auto px-4 py-3 flex gap-6">
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
      </div>
    </nav>
  )
}
