import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TrackerData } from '@/types'

// Simulate the file system with an in-memory store so tests don't touch disk.
// writeFileSync captures the serialised data; readFileSync serves it back.
let store: TrackerData

vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn((): string => JSON.stringify(store)),
    writeFileSync: vi.fn((_path: unknown, content: unknown): void => {
      store = JSON.parse(content as string) as TrackerData
    }),
  },
}))

import {
  getActiveHobbies,
  addHobby,
  removeHobby,
  upsertLogEntry,
  computeStreak,
  getDailyCountMap,
} from '@/lib/storage'

function emptyStore(): TrackerData {
  return { hobbies: [], routines: [], logEntries: [] }
}

beforeEach(() => {
  store = emptyStore()
})

// ---------------------------------------------------------------------------
// getActiveHobbies
// ---------------------------------------------------------------------------
describe('getActiveHobbies', () => {
  it('returns empty array when no hobbies exist', () => {
    expect(getActiveHobbies()).toEqual([])
  })

  it('returns only hobbies where removedAt is null', () => {
    store.hobbies = [
      { id: '1', name: 'Reading', type: 'boolean', createdAt: '2026-01-01T00:00:00Z', removedAt: null },
      { id: '2', name: 'Running', type: 'boolean', createdAt: '2026-01-01T00:00:00Z', removedAt: '2026-01-10T00:00:00Z' },
    ]
    const result = getActiveHobbies()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('backfills missing type field to boolean', () => {
    // Simulate an old entry without a type field
    store.hobbies = [{ id: '1', name: 'Old', createdAt: '2026-01-01T00:00:00Z', removedAt: null } as never]
    const result = getActiveHobbies()
    expect(result[0].type).toBe('boolean')
  })
})

// ---------------------------------------------------------------------------
// addHobby
// ---------------------------------------------------------------------------
describe('addHobby', () => {
  it('adds a boolean hobby with correct fields', () => {
    const hobby = addHobby('Journaling', 'boolean')
    expect(hobby.name).toBe('Journaling')
    expect(hobby.type).toBe('boolean')
    expect(hobby.removedAt).toBeNull()
    expect(hobby.id).toBeTruthy()
    expect(hobby.goal).toBeUndefined()
  })

  it('adds a non-boolean hobby with goal', () => {
    const hobby = addHobby('Reading', 'counter', { target: 20, unit: 'pages' })
    expect(hobby.type).toBe('counter')
    expect(hobby.goal).toEqual({ target: 20, unit: 'pages' })
  })

  it('persists the hobby so subsequent reads include it', () => {
    addHobby('Meditation', 'time', { target: 10, unit: 'min' })
    expect(getActiveHobbies()).toHaveLength(1)
    expect(getActiveHobbies()[0].name).toBe('Meditation')
  })
})

// ---------------------------------------------------------------------------
// removeHobby
// ---------------------------------------------------------------------------
describe('removeHobby', () => {
  it('soft-deletes by setting removedAt', () => {
    const hobby = addHobby('Yoga', 'boolean')
    removeHobby(hobby.id)
    expect(getActiveHobbies()).toHaveLength(0)
    expect(store.hobbies[0].removedAt).not.toBeNull()
  })

  it('does nothing for an unknown id', () => {
    addHobby('Yoga', 'boolean')
    removeHobby('nonexistent')
    expect(getActiveHobbies()).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// upsertLogEntry — boolean toggle
// ---------------------------------------------------------------------------
describe('upsertLogEntry (boolean toggle)', () => {
  it('adds an entry when none exists', () => {
    upsertLogEntry('h1', '2026-04-01')
    expect(store.logEntries).toHaveLength(1)
    expect(store.logEntries[0]).toEqual({ hobbyId: 'h1', date: '2026-04-01' })
  })

  it('removes the entry when one already exists (toggle off)', () => {
    store.logEntries = [{ hobbyId: 'h1', date: '2026-04-01' }]
    upsertLogEntry('h1', '2026-04-01')
    expect(store.logEntries).toHaveLength(0)
  })

  it('does not affect entries for other hobbies or dates', () => {
    store.logEntries = [
      { hobbyId: 'h1', date: '2026-04-01' },
      { hobbyId: 'h2', date: '2026-04-01' },
    ]
    upsertLogEntry('h1', '2026-04-01')
    expect(store.logEntries).toHaveLength(1)
    expect(store.logEntries[0].hobbyId).toBe('h2')
  })
})

// ---------------------------------------------------------------------------
// upsertLogEntry — value-based (counter / quantity / time)
// ---------------------------------------------------------------------------
describe('upsertLogEntry (with value)', () => {
  it('creates a new entry with the given value', () => {
    upsertLogEntry('h1', '2026-04-01', 15)
    expect(store.logEntries[0]).toEqual({ hobbyId: 'h1', date: '2026-04-01', value: 15 })
  })

  it('overwrites an existing value', () => {
    store.logEntries = [{ hobbyId: 'h1', date: '2026-04-01', value: 5 }]
    upsertLogEntry('h1', '2026-04-01', 20)
    expect(store.logEntries).toHaveLength(1)
    expect(store.logEntries[0].value).toBe(20)
  })

  it('removes the entry when value is 0', () => {
    store.logEntries = [{ hobbyId: 'h1', date: '2026-04-01', value: 10 }]
    upsertLogEntry('h1', '2026-04-01', 0)
    expect(store.logEntries).toHaveLength(0)
  })

  it('removes the entry when value is negative', () => {
    store.logEntries = [{ hobbyId: 'h1', date: '2026-04-01', value: 10 }]
    upsertLogEntry('h1', '2026-04-01', -1)
    expect(store.logEntries).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// computeStreak
// ---------------------------------------------------------------------------
describe('computeStreak', () => {
  it('returns { current: 0, best: 0 } with no entries', () => {
    expect(computeStreak('h1', '2026-04-26')).toEqual({ current: 0, best: 0 })
  })

  it('returns { current: 1, best: 1 } for a single entry matching today', () => {
    store.logEntries = [{ hobbyId: 'h1', date: '2026-04-26' }]
    expect(computeStreak('h1', '2026-04-26')).toEqual({ current: 1, best: 1 })
  })

  it('returns current = 0 when today has no entry even if yesterday did', () => {
    store.logEntries = [{ hobbyId: 'h1', date: '2026-04-25' }]
    const result = computeStreak('h1', '2026-04-26')
    expect(result.current).toBe(0)
    expect(result.best).toBe(1)
  })

  it('counts consecutive days ending today as current streak', () => {
    store.logEntries = [
      { hobbyId: 'h1', date: '2026-04-24' },
      { hobbyId: 'h1', date: '2026-04-25' },
      { hobbyId: 'h1', date: '2026-04-26' },
    ]
    const result = computeStreak('h1', '2026-04-26')
    expect(result.current).toBe(3)
    expect(result.best).toBe(3)
  })

  it('stops current streak at a gap', () => {
    store.logEntries = [
      { hobbyId: 'h1', date: '2026-04-20' }, // older run of 1
      { hobbyId: 'h1', date: '2026-04-25' },
      { hobbyId: 'h1', date: '2026-04-26' },
    ]
    const result = computeStreak('h1', '2026-04-26')
    expect(result.current).toBe(2)
    expect(result.best).toBe(2)
  })

  it('tracks best streak across a broken run', () => {
    store.logEntries = [
      { hobbyId: 'h1', date: '2026-04-10' },
      { hobbyId: 'h1', date: '2026-04-11' },
      { hobbyId: 'h1', date: '2026-04-12' }, // run of 3
      { hobbyId: 'h1', date: '2026-04-26' }, // run of 1 (today)
    ]
    const result = computeStreak('h1', '2026-04-26')
    expect(result.current).toBe(1)
    expect(result.best).toBe(3)
  })

  it('ignores entries from other hobbies', () => {
    store.logEntries = [
      { hobbyId: 'h2', date: '2026-04-26' },
    ]
    expect(computeStreak('h1', '2026-04-26')).toEqual({ current: 0, best: 0 })
  })
})

// ---------------------------------------------------------------------------
// getDailyCountMap
// ---------------------------------------------------------------------------
describe('getDailyCountMap', () => {
  it('returns an empty map when there are no entries', () => {
    expect(getDailyCountMap().size).toBe(0)
  })

  it('counts one entry per date correctly', () => {
    store.logEntries = [
      { hobbyId: 'h1', date: '2026-04-01' },
      { hobbyId: 'h2', date: '2026-04-02' },
    ]
    const map = getDailyCountMap()
    expect(map.get('2026-04-01')).toBe(1)
    expect(map.get('2026-04-02')).toBe(1)
  })

  it('sums multiple entries on the same date', () => {
    store.logEntries = [
      { hobbyId: 'h1', date: '2026-04-01' },
      { hobbyId: 'h2', date: '2026-04-01' },
      { hobbyId: 'h3', date: '2026-04-01' },
    ]
    expect(getDailyCountMap().get('2026-04-01')).toBe(3)
  })
})
