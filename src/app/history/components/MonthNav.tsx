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
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={() => shift(-1)}
        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
      >
        ‹ Prev
      </button>
      <span className="font-semibold text-slate-800 flex-1 text-center">{label}</span>
      <button
        onClick={() => shift(1)}
        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
      >
        Next ›
      </button>
    </div>
  )
}
