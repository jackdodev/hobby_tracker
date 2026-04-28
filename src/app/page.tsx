import {
  getActiveHobbies,
  getActiveRoutines,
  getLogEntriesForDate,
  computeStreak,
  computeRoutineStreak,
} from '@/lib/storage'
import ToggleButton from '@/app/components/ToggleButton'
import CounterInput from '@/app/components/CounterInput'
import QuantityInput from '@/app/components/QuantityInput'
import TimeInput from '@/app/components/TimeInput'
import RoutineCard from '@/app/components/RoutineCard'
import type { Hobby, LogEntry, StreakInfo } from '@/types'

function todayString(): string {
  return new Date().toLocaleDateString('en-CA')
}

function renderHobby(hobby: Hobby, entry: LogEntry | undefined, today: string, streak: StreakInfo) {
  if (hobby.type === 'counter' && hobby.goal)
    return <CounterInput hobbyId={hobby.id} hobbyName={hobby.name} date={today} value={entry?.value ?? 0} goal={hobby.goal} streak={streak} />
  if (hobby.type === 'quantity' && hobby.goal)
    return <QuantityInput hobbyId={hobby.id} hobbyName={hobby.name} date={today} value={entry?.value ?? 0} goal={hobby.goal} streak={streak} />
  if (hobby.type === 'time' && hobby.goal)
    return <TimeInput hobbyId={hobby.id} hobbyName={hobby.name} date={today} value={entry?.value ?? 0} goal={hobby.goal} streak={streak} />
  return <ToggleButton hobbyId={hobby.id} hobbyName={hobby.name} date={today} checked={!!entry} streak={streak} />
}

function isHobbyDone(hobby: Hobby, entry: LogEntry | undefined): boolean {
  if (!entry) return false
  if (hobby.type === 'boolean') return true
  return (entry.value ?? 0) >= (hobby.goal?.target ?? 1)
}

export default function TodayPage() {
  const today = todayString()
  const allHobbies = getActiveHobbies()
  const routines = getActiveRoutines()
  const entries = getLogEntriesForDate(today)
  const entryMap = new Map(entries.map((e) => [e.hobbyId, e]))

  const routineHobbyIds = new Set(routines.flatMap((r) => r.hobbyIds))
  const standaloneHobbies = allHobbies.filter((h) => !routineHobbyIds.has(h.id))

  const formatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const standaloneDone = standaloneHobbies.filter((h) => isHobbyDone(h, entryMap.get(h.id))).length
  const routinesDone = routines.filter((r) => {
    const rHobbies = r.hobbyIds
      .map((id) => allHobbies.find((h) => h.id === id))
      .filter((h): h is Hobby => h !== undefined)
    return rHobbies.length > 0 && rHobbies.every((h) => isHobbyDone(h, entryMap.get(h.id)))
  }).length

  const totalItems = standaloneHobbies.length + routines.length
  const totalDone = standaloneDone + routinesDone

  const empty = allHobbies.length === 0 && routines.length === 0

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Today&apos;s Achievement</h1>
      <p className="text-gray-500 mb-6">{formatted}</p>

      {empty ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No hobbies added yet.</p>
          <a
            href="/hobbies"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Add your first hobby
          </a>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {standaloneHobbies.map((hobby) => (
            <li key={hobby.id}>
              {renderHobby(hobby, entryMap.get(hobby.id), today, computeStreak(hobby.id, today))}
            </li>
          ))}

          {routines.map((routine) => {
            const rHobbies = routine.hobbyIds
              .map((id) => allHobbies.find((h) => h.id === id))
              .filter((h): h is Hobby => h !== undefined)
            const streaks: Record<string, StreakInfo> = Object.fromEntries(
              rHobbies.map((h) => [h.id, computeStreak(h.id, today)])
            )
            return (
              <li key={routine.id}>
                <RoutineCard
                  routine={routine}
                  hobbies={rHobbies}
                  entries={entries}
                  today={today}
                  streaks={streaks}
                  routineStreak={computeRoutineStreak(routine, today)}
                />
              </li>
            )
          })}
        </ul>
      )}

      {!empty && (
        <p className="mt-6 text-sm text-gray-400">
          {totalDone} / {totalItems} completed today
        </p>
      )}
    </div>
  )
}
