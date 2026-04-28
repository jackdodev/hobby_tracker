export const dynamic = 'force-dynamic'

import { getActiveHobbies, getActiveRoutines } from '@/lib/storage'
import AddHobbyModal from './components/AddHobbyModal'
import AddRoutineModal from './components/AddRoutineModal'
import HobbyRow from './components/HobbyRow'
import RoutineRow from './components/RoutineRow'
import type { Hobby } from '@/types'

export default async function HobbiesPage() {
  const allHobbies = await getActiveHobbies()
  const routines = await getActiveRoutines()

  const routineHobbyIds = new Set(routines.flatMap((r) => r.hobbyIds))
  const standaloneHobbies = allHobbies.filter((h) => !routineHobbyIds.has(h.id))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Manage Hobbies</h1>
      <p className="text-gray-500 mb-6">Add or remove the hobbies you want to track daily.</p>

      {standaloneHobbies.length === 0 && routines.length === 0 ? (
        <p className="text-gray-400 text-sm py-2">No hobbies yet. Add one below to get started.</p>
      ) : (
        <>
          {standaloneHobbies.length > 0 && (
            <ul className="flex flex-col divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden mb-6">
              {standaloneHobbies.map((hobby) => (
                <HobbyRow key={hobby.id} hobby={hobby} />
              ))}
            </ul>
          )}

          {routines.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Routines</h2>
              <ul className="flex flex-col divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                {routines.map((routine) => {
                  const rHobbies = routine.hobbyIds
                    .map((id) => allHobbies.find((h) => h.id === id))
                    .filter((h): h is Hobby => h !== undefined)
                  return <RoutineRow key={routine.id} routine={routine} hobbies={rHobbies} />
                })}
              </ul>
            </div>
          )}
        </>
      )}

      <div className="flex gap-3 flex-wrap mt-6">
        <AddHobbyModal />
        <AddRoutineModal />
      </div>
    </div>
  )
}
