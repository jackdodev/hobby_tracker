import type { Hobby, LogEntry, StreakInfo } from '@/types'

export function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA')
}

export function streakFromDateSet(dateSet: Set<string>, today: string): StreakInfo {
  let current = 0
  let cursor = today
  while (dateSet.has(cursor)) {
    current++
    cursor = offsetDate(cursor, -1)
  }

  const sorted = [...dateSet].sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const date of sorted) {
    if (prev !== null && date === offsetDate(prev, 1)) run++
    else run = 1
    if (run > best) best = run
    prev = date
  }

  return { current, best: Math.max(best, current) }
}

export function isEntryComplete(hobby: Hobby, entry: LogEntry): boolean {
  if (hobby.type === 'boolean' || !hobby.goal) return true
  return (entry.value ?? 0) >= hobby.goal.target
}

export function buildCompletionMap(
  hobbies: Hobby[],
  entries: LogEntry[]
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const hobby of hobbies) map.set(hobby.id, new Set())

  for (const entry of entries) {
    const hobby = hobbies.find((h) => h.id === entry.hobbyId)
    if (!hobby) continue
    if (isEntryComplete(hobby, entry)) {
      map.get(hobby.id)!.add(entry.date)
    }
  }
  return map
}
