export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getActiveHobbies, getActiveRoutines } from '@/lib/storage'
import AddHobbyModal from './components/AddHobbyModal'
import AddRoutineModal from './components/AddRoutineModal'
import HobbyRow from './components/HobbyRow'
import RoutineRow from './components/RoutineRow'
import type { Hobby } from '@/types'

export default async function HobbiesPage() {
  const jar = await cookies()
  const userId = jar.get('userId')?.value ?? ''

  const allHobbies = await getActiveHobbies(userId)
  const routines = await getActiveRoutines(userId)

  const routineHobbyIds = new Set(routines.flatMap((r) => r.hobbyIds))
  const standaloneHobbies = allHobbies.filter((h) => !routineHobbyIds.has(h.id))

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-0.5">Manage Hobbies</h1>
      <p className="text-slate-400 text-sm mb-6">Add or remove the hobbies you want to track daily.</p>

      {standaloneHobbies.length === 0 && routines.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-slate-500 text-sm">No hobbies yet. Add one below to get started.</p>
        </div>
      ) : (
        <>
          {standaloneHobbies.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Hobbies</h2>
              <ul className="flex flex-col divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                {standaloneHobbies.map((hobby) => (
                  <HobbyRow key={hobby.id} hobby={hobby} />
                ))}
              </ul>
            </div>
          )}

          {routines.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Routines</h2>
              <ul className="flex flex-col divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
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

      <div className="flex gap-3 flex-wrap">
        <AddHobbyModal />
        <AddRoutineModal />
      </div>
    </div>
  )
}
