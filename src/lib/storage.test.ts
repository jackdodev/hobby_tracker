import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TrackerData } from '@/types'

// Simulate KV with an in-memory store. createClient returns an object whose
// get/set methods read and write the in-memory store.
let store: TrackerData

vi.mock('@vercel/kv', () => ({
  createClient: vi.fn(() => ({
    get: vi.fn(async (): Promise<TrackerData> => store),
    set: vi.fn(async (_key: unknown, value: unknown): Promise<void> => {
      store = value as TrackerData
    }),
  })),
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
  it('returns empty array when no hobbies exist', async () => {
    expect(await getActiveHobbies('user1')).toEqual([])
  })

  it('returns only hobbies where removedAt is null', async () => {
    store.hobbies = [
      { id: '1', name: 'Reading', type: 'boolean', createdAt: '2026-01-01T00:00:00Z', removedAt: null },
      { id: '2', name: 'Running', type: 'boolean', createdAt: '2026-01-01T00:00:00Z', removedAt: '2026-01-10T00:00:00Z' },
    ]
    const result = await getActiveHobbies('user1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('backfills missing type field to boolean', async () => {
    store.hobbies = [{ id: '1', name: 'Old', createdAt: '2026-01-01T00:00:00Z', removedAt: null } as never]
    const result = await getActiveHobbies('user1')
    expect(result[0].type).toBe('boolean')
  })
})

// ---------------------------------------------------------------------------
// addHobby
// ---------------------------------------------------------------------------
describe('addHobby', () => {
  it('adds a boolean hobby with correct fields', async () => {
    const hobby = await addHobby('user1', 'Journaling', 'boolean')
    expect(hobby.name).toBe('Journaling')
    expect(hobby.type).toBe('boolean')
    expect(hobby.removedAt).toBeNull()
    expect(hobby.id).toBeTruthy()
    expect(hobby.goal).toBeUndefined()
  })

  it('adds a non-boolean hobby with goal', async () => {
    const hobby = await addHobby('user1', 'Reading', 'counter', { target: 20, unit: 'pages' })
    expect(hobby.type).toBe('counter')
    expect(hobby.goal).toEqual({ target: 20, unit: 'pages' })
  })

  it('persists the hobby so subsequent reads include it', async () => {
    await addHobby('user1', 'Meditation', 'time', { target: 10, unit: 'min' })
    expect(await getActiveHobbies('user1')).toHaveLength(1)
    expect((await getActiveHobbies('user1'))[0].name).toBe('Meditation')
  })
})

// ---------------------------------------------------------------------------
// removeHobby
// ---------------------------------------------------------------------------
describe('removeHobby', () => {
  it('soft-deletes by setting removedAt', async () => {
    const hobby = await addHobby('user1', 'Yoga', 'boolean')
    await removeHobby('user1', hobby.id)
    expect(await getActiveHobbies('user1')).toHaveLength(0)
    expect(store.hobbies[0].removedAt).not.toBeNull()
  })

  it('does nothing for an unknown id', async () => {
    await addHobby('user1', 'Yoga', 'boolean')
    await removeHobby('user1', 'nonexistent')
    expect(await getActiveHobbies('user1')).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// upsertLogEntry — boolean toggle
// ---------------------------------------------------------------------------
describe('upsertLogEntry (boolean toggle)', () => {
  it('adds an entry when none exists', async () => {
    await upsertLogEntry('user1', 'h1', '2026-04-01')
    expect(store.logEntries).toHaveLength(1)
    expect(store.logEntries[0]).toEqual({ hobbyId: 'h1', date: '2026-04-01' })
  })

  it('removes the entry when one already exists (toggle off)', async () => {
    store.logEntries = [{ hobbyId: 'h1', date: '2026-04-01' }]
    await upsertLogEntry('user1', 'h1', '2026-04-01')
    expect(store.logEntries).toHaveLength(0)
  })

  it('does not affect entries for other hobbies or dates', async () => {
    store.logEntries = [
      { hobbyId: 'h1', date: '2026-04-01' },
      { hobbyId: 'h2', date: '2026-04-01' },
    ]
    await upsertLogEntry('user1', 'h1', '2026-04-01')
    expect(store.logEntries).toHaveLength(1)
    expect(store.logEntries[0].hobbyId).toBe('h2')
  })
})

// ---------------------------------------------------------------------------
// upsertLogEntry — value-based
// ---------------------------------------------------------------------------
describe('upsertLogEntry (with value)', () => {
  it('creates a new entry with the given value', async () => {
    await upsertLogEntry('user1', 'h1', '2026-04-01', 15)
    expect(store.logEntries[0]).toEqual({ hobbyId: 'h1', date: '2026-04-01', value: 15 })
  })

  it('overwrites an existing value', async () => {
    store.logEntries = [{ hobbyId: 'h1', date: '2026-04-01', value: 5 }]
    await upsertLogEntry('user1', 'h1', '2026-04-01', 20)
    expect(store.logEntries).toHaveLength(1)
    expect(store.logEntries[0].value).toBe(20)
  })

  it('removes the entry when value is 0', async () => {
    store.logEntries = [{ hobbyId: 'h1', date: '2026-04-01', value: 10 }]
    await upsertLogEntry('user1', 'h1', '2026-04-01', 0)
    expect(store.logEntries).toHaveLength(0)
  })

  it('removes the entry when value is negative', async () => {
    store.logEntries = [{ hobbyId: 'h1', date: '2026-04-01', value: 10 }]
    await upsertLogEntry('user1', 'h1', '2026-04-01', -1)
    expect(store.logEntries).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// computeStreak
// ---------------------------------------------------------------------------
describe('computeStreak', () => {
  it('returns { current: 0, best: 0 } with no entries', async () => {
    expect(await computeStreak('user1', 'h1', '2026-04-26')).toEqual({ current: 0, best: 0 })
  })

  it('returns { current: 1, best: 1 } for a single entry matching today', async () => {
    store.logEntries = [{ hobbyId: 'h1', date: '2026-04-26' }]
    expect(await computeStreak('user1', 'h1', '2026-04-26')).toEqual({ current: 1, best: 1 })
  })

  it('returns current = 0 when today has no entry even if yesterday did', async () => {
    store.logEntries = [{ hobbyId: 'h1', date: '2026-04-25' }]
    const result = await computeStreak('user1', 'h1', '2026-04-26')
    expect(result.current).toBe(0)
    expect(result.best).toBe(1)
  })

  it('counts consecutive days ending today as current streak', async () => {
    store.logEntries = [
      { hobbyId: 'h1', date: '2026-04-24' },
      { hobbyId: 'h1', date: '2026-04-25' },
      { hobbyId: 'h1', date: '2026-04-26' },
    ]
    const result = await computeStreak('user1', 'h1', '2026-04-26')
    expect(result.current).toBe(3)
    expect(result.best).toBe(3)
  })

  it('stops current streak at a gap', async () => {
    store.logEntries = [
      { hobbyId: 'h1', date: '2026-04-20' },
      { hobbyId: 'h1', date: '2026-04-25' },
      { hobbyId: 'h1', date: '2026-04-26' },
    ]
    const result = await computeStreak('user1', 'h1', '2026-04-26')
    expect(result.current).toBe(2)
    expect(result.best).toBe(2)
  })

  it('tracks best streak across a broken run', async () => {
    store.logEntries = [
      { hobbyId: 'h1', date: '2026-04-10' },
      { hobbyId: 'h1', date: '2026-04-11' },
      { hobbyId: 'h1', date: '2026-04-12' },
      { hobbyId: 'h1', date: '2026-04-26' },
    ]
    const result = await computeStreak('user1', 'h1', '2026-04-26')
    expect(result.current).toBe(1)
    expect(result.best).toBe(3)
  })

  it('ignores entries from other hobbies', async () => {
    store.logEntries = [{ hobbyId: 'h2', date: '2026-04-26' }]
    expect(await computeStreak('user1', 'h1', '2026-04-26')).toEqual({ current: 0, best: 0 })
  })
})

// ---------------------------------------------------------------------------
// getDailyCountMap
// ---------------------------------------------------------------------------
describe('getDailyCountMap', () => {
  it('returns an empty map when there are no entries', async () => {
    expect((await getDailyCountMap('user1')).size).toBe(0)
  })

  it('counts one entry per date correctly', async () => {
    store.logEntries = [
      { hobbyId: 'h1', date: '2026-04-01' },
      { hobbyId: 'h2', date: '2026-04-02' },
    ]
    const map = await getDailyCountMap('user1')
    expect(map.get('2026-04-01')).toBe(1)
    expect(map.get('2026-04-02')).toBe(1)
  })

  it('sums multiple entries on the same date', async () => {
    store.logEntries = [
      { hobbyId: 'h1', date: '2026-04-01' },
      { hobbyId: 'h2', date: '2026-04-01' },
      { hobbyId: 'h3', date: '2026-04-01' },
    ]
    expect((await getDailyCountMap('user1')).get('2026-04-01')).toBe(3)
  })
})
