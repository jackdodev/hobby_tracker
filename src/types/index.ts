export type HobbyType = 'boolean' | 'quantity' | 'counter' | 'time'

export type HobbyGoal = {
  target: number
  unit: string
}

export type StreakInfo = {
  current: number
  best: number
}

export type Hobby = {
  id: string
  name: string
  createdAt: string
  removedAt: string | null
  type: HobbyType
  goal?: HobbyGoal
}

export type LogEntry = {
  hobbyId: string
  date: string // YYYY-MM-DD
  value?: number
}

export type Routine = {
  id: string
  name: string
  hobbyIds: string[]
  createdAt: string
  removedAt: string | null
}

export type TrackerData = {
  hobbies: Hobby[]
  routines: Routine[]
  logEntries: LogEntry[]
}
