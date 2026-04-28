'use client'

import { useRouter } from 'next/navigation'

type Props = {
  current: string // YYYY-MM
}

export default function MonthNav({ current }: Props) {
  const router = useRouter()
  const [year, month] = current.split('-').map(Number)

  function shift(delta: number) {
    const d = new Date(year, month - 1 + delta, 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    router.push(`/history?month=${next}`)
  }

  const label = new Date(year, month - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex items-center gap-4 mb-6">
      <button
        onClick={() => shift(-1)}
        className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-100"
      >
        ‹ Prev
      </button>
      <span className="font-semibold text-lg">{label}</span>
      <button
        onClick={() => shift(1)}
        className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-100"
      >
        Next ›
      </button>
    </div>
  )
}
