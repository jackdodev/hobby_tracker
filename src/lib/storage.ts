import { createClient } from '@vercel/kv'

const kv = createClient({
  url: process.env.hb_KV_REST_API_URL!,
  token: process.env.hb_KV_REST_API_TOKEN!,
})
import type { TrackerData, Hobby, HobbyType, HobbyGoal, LogEntry, Routine, StreakInfo } from '@/types'

async function read(): Promise<TrackerData> {
  const data = await kv.get<TrackerData>('tracker')
  if (!data) return { hobbies: [], routines: [], logEntries: [] }
  data.hobbies = data.hobbies.map((h) => ({ ...h, type: (h.type ?? 'boolean') as HobbyType }))
  data.routines = data.routines ?? []
  return data
}

async function write(data: TrackerData): Promise<void> {
  await kv.set('tracker', data)
}

export async function getHobbies(): Promise<Hobby[]> {
  return (await read()).hobbies
}

export async function getActiveHobbies(): Promise<Hobby[]> {
  return (await read()).hobbies.filter((h) => h.removedAt === null)
}

export async function addHobby(name: string, type: HobbyType, goal?: HobbyGoal): Promise<Hobby> {
  const data = await read()
  const hobby: Hobby = {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
    removedAt: null,
    type,
    ...(goal ? { goal } : {}),
  }
  data.hobbies.push(hobby)
  await write(data)
  return hobby
}

export async function updateHobbyGoal(id: string, goal: HobbyGoal): Promise<void> {
  const data = await read()
  const hobby = data.hobbies.find((h) => h.id === id)
  if (hobby) {
    hobby.goal = goal
    await write(data)
  }
}

export async function removeHobby(id: string): Promise<void> {
  const data = await read()
  const hobby = data.hobbies.find((h) => h.id === id)
  if (hobby) {
    hobby.removedAt = new Date().toISOString()
    await write(data)
  }
}

export async function getRoutines(): Promise<Routine[]> {
  return (await read()).routines
}

export async function getActiveRoutines(): Promise<Routine[]> {
  return (await read()).routines.filter((r) => r.removedAt === null)
}

export async function addRoutine(name: string, hobbyIds: string[]): Promise<Routine> {
  const data = await read()
  const routine: Routine = {
    id: crypto.randomUUID(),
    name: name.trim(),
    hobbyIds,
    createdAt: new Date().toISOString(),
    removedAt: null,
  }
  data.routines.push(routine)
  await write(data)
  return routine
}

export async function removeRoutine(id: string): Promise<void> {
  const data = await read()
  const routine = data.routines.find((r) => r.id === id)
  if (routine) {
    routine.removedAt = new Date().toISOString()
    await write(data)
  }
}

export async function getLogEntriesForDate(date: string): Promise<LogEntry[]> {
  return (await read()).logEntries.filter((e) => e.date === date)
}

export async function getLogEntriesForMonth(yearMonth: string): Promise<LogEntry[]> {
  return (await read()).logEntries.filter((e) => e.date.startsWith(yearMonth))
}

export async function getAllLogEntries(): Promise<LogEntry[]> {
  return (await read()).logEntries
}

export async function upsertLogEntry(hobbyId: string, date: string, value?: number): Promise<void> {
  const data = await read()
  const idx = data.logEntries.findIndex((e) => e.hobbyId === hobbyId && e.date === date)

  if (value === undefined) {
    if (idx !== -1) data.logEntries.splice(idx, 1)
    else data.logEntries.push({ hobbyId, date })
  } else if (value <= 0) {
    if (idx !== -1) data.logEntries.splice(idx, 1)
  } else {
    if (idx !== -1) data.logEntries[idx] = { hobbyId, date, value }
    else data.logEntries.push({ hobbyId, date, value })
  }

  await write(data)
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA')
}

function streakFromEntries(dateSet: Set<string>, today: string): StreakInfo {
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

export async function computeStreak(hobbyId: string, today: string): Promise<StreakInfo> {
  const entries = (await read()).logEntries.filter((e) => e.hobbyId === hobbyId)
  return streakFromEntries(new Set(entries.map((e) => e.date)), today)
}

export async function computeRoutineStreak(routine: Routine, today: string): Promise<StreakInfo> {
  if (routine.hobbyIds.length === 0) return { current: 0, best: 0 }
  const data = await read()

  const hobbyDoneSets = routine.hobbyIds.map((hobbyId) => {
    const hobby = data.hobbies.find((h) => h.id === hobbyId)
    const entries = data.logEntries.filter((e) => e.hobbyId === hobbyId)
    const done = new Set<string>()
    for (const entry of entries) {
      if (!hobby || hobby.type === 'boolean' || !hobby.goal) done.add(entry.date)
      else if ((entry.value ?? 0) >= hobby.goal.target) done.add(entry.date)
    }
    return done
  })

  const allDates = new Set<string>()
  for (const s of hobbyDoneSets) for (const d of s) allDates.add(d)
  const routineDone = new Set([...allDates].filter((d) => hobbyDoneSets.every((s) => s.has(d))))

  return streakFromEntries(routineDone, today)
}

export async function getDailyCountMap(): Promise<Map<string, number>> {
  const entries = (await read()).logEntries
  const map = new Map<string, number>()
  for (const entry of entries) {
    map.set(entry.date, (map.get(entry.date) ?? 0) + 1)
  }
  return map
}
