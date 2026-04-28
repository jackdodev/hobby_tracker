import fs from 'fs'
import path from 'path'
import type { TrackerData, Hobby, HobbyType, HobbyGoal, LogEntry, Routine, StreakInfo } from '@/types'

const DATA_PATH = path.join(process.cwd(), 'data', 'tracker.json')

function read(): TrackerData {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8')
  const data = JSON.parse(raw) as TrackerData
  // Backwards compat: hobbies created before the type field default to 'boolean'
  data.hobbies = data.hobbies.map((h) => ({ ...h, type: (h.type ?? 'boolean') as HobbyType }))
  data.routines = data.routines ?? []
  return data
}

function write(data: TrackerData): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export function getHobbies(): Hobby[] {
  return read().hobbies
}

export function getActiveHobbies(): Hobby[] {
  return read().hobbies.filter((h) => h.removedAt === null)
}

export function addHobby(name: string, type: HobbyType, goal?: HobbyGoal): Hobby {
  const data = read()
  const hobby: Hobby = {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
    removedAt: null,
    type,
    ...(goal ? { goal } : {}),
  }
  data.hobbies.push(hobby)
  write(data)
  return hobby
}

export function updateHobbyGoal(id: string, goal: HobbyGoal): void {
  const data = read()
  const hobby = data.hobbies.find((h) => h.id === id)
  if (hobby) {
    hobby.goal = goal
    write(data)
  }
}

export function removeHobby(id: string): void {
  const data = read()
  const hobby = data.hobbies.find((h) => h.id === id)
  if (hobby) {
    hobby.removedAt = new Date().toISOString()
    write(data)
  }
}

export function getRoutines(): Routine[] {
  return read().routines
}

export function getActiveRoutines(): Routine[] {
  return read().routines.filter((r) => r.removedAt === null)
}

export function addRoutine(name: string, hobbyIds: string[]): Routine {
  const data = read()
  const routine: Routine = {
    id: crypto.randomUUID(),
    name: name.trim(),
    hobbyIds,
    createdAt: new Date().toISOString(),
    removedAt: null,
  }
  data.routines.push(routine)
  write(data)
  return routine
}

export function removeRoutine(id: string): void {
  const data = read()
  const routine = data.routines.find((r) => r.id === id)
  if (routine) {
    routine.removedAt = new Date().toISOString()
    write(data)
  }
}

export function computeRoutineStreak(routine: Routine, today: string): StreakInfo {
  if (routine.hobbyIds.length === 0) return { current: 0, best: 0 }
  const data = read()

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

  let current = 0
  let cursor = today
  while (routineDone.has(cursor)) {
    current++
    cursor = offsetDate(cursor, -1)
  }

  const sorted = [...routineDone].sort()
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

export function getLogEntriesForDate(date: string): LogEntry[] {
  return read().logEntries.filter((e) => e.date === date)
}

export function getLogEntriesForMonth(yearMonth: string): LogEntry[] {
  return read().logEntries.filter((e) => e.date.startsWith(yearMonth))
}

export function getAllLogEntries(): LogEntry[] {
  return read().logEntries
}

export function upsertLogEntry(hobbyId: string, date: string, value?: number): void {
  const data = read()
  const idx = data.logEntries.findIndex((e) => e.hobbyId === hobbyId && e.date === date)

  if (value === undefined) {
    // boolean toggle: add if absent, remove if present
    if (idx !== -1) data.logEntries.splice(idx, 1)
    else data.logEntries.push({ hobbyId, date })
  } else if (value <= 0) {
    // zero value: remove entry
    if (idx !== -1) data.logEntries.splice(idx, 1)
  } else {
    // set / overwrite value
    if (idx !== -1) data.logEntries[idx] = { hobbyId, date, value }
    else data.logEntries.push({ hobbyId, date, value })
  }

  write(data)
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA')
}

export function computeStreak(hobbyId: string, today: string): StreakInfo {
  const entries = read().logEntries.filter((e) => e.hobbyId === hobbyId)
  const dateSet = new Set(entries.map((e) => e.date))

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
    if (prev !== null && date === offsetDate(prev, 1)) {
      run++
    } else {
      run = 1
    }
    if (run > best) best = run
    prev = date
  }

  return { current, best: Math.max(best, current) }
}

export function getDailyCountMap(): Map<string, number> {
  const entries = read().logEntries
  const map = new Map<string, number>()
  for (const entry of entries) {
    map.set(entry.date, (map.get(entry.date) ?? 0) + 1)
  }
  return map
}
