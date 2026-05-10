import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getHobbies, getAllLogEntries } from '@/lib/storage'
import { isEntryComplete } from '@/lib/utils'

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  const userId = session?.user?.email
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [hobbies, entries] = await Promise.all([
    getHobbies(userId),
    getAllLogEntries(userId),
  ])

  const hobbyMap = new Map(hobbies.map((h) => [h.id, h]))

  const rows: string[][] = [['date', 'hobby', 'type', 'goal_target', 'goal_unit', 'value', 'complete']]

  for (const entry of [...entries].sort((a, b) => a.date.localeCompare(b.date))) {
    const hobby = hobbyMap.get(entry.hobbyId)
    if (!hobby) continue
    rows.push([
      entry.date,
      hobby.name,
      hobby.type,
      hobby.goal ? String(hobby.goal.target) : '',
      hobby.goal?.unit ?? '',
      entry.value !== undefined ? String(entry.value) : '',
      isEntryComplete(hobby, entry) ? 'true' : 'false',
    ])
  }

  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="hobby-tracker-${new Date().toLocaleDateString('en-CA')}.csv"`,
    },
  })
}
