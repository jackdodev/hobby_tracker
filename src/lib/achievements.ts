import type { TrackerData, AchievementDef } from '@/types'
import { isEntryComplete, streakFromDateSet } from '@/lib/utils'

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: 'first_log',        name: 'First Step',      description: 'Log your first hobby',                  emoji: '🌱', points: 5 },
  { id: 'streak_3',         name: 'On a Roll',        description: '3-day streak on any hobby',             emoji: '🔥', points: 15 },
  { id: 'streak_7',         name: 'Week Warrior',     description: '7-day streak on any hobby',             emoji: '⚡', points: 30 },
  { id: 'streak_14',        name: 'Fortnight Force',  description: '14-day streak on any hobby',            emoji: '💥', points: 60 },
  { id: 'streak_30',        name: 'Month Master',     description: '30-day streak on any hobby',            emoji: '🏆', points: 100 },
  { id: 'completions_10',   name: 'Getting Started',  description: '10 total completions',                  emoji: '📈', points: 20 },
  { id: 'completions_50',   name: 'Dedicated',        description: '50 total completions',                  emoji: '💪', points: 50 },
  { id: 'completions_100',  name: 'Century Club',     description: '100 total completions',                 emoji: '💯', points: 100 },
  { id: 'completions_500',  name: 'Legend',           description: '500 total completions',                 emoji: '🌟', points: 250 },
  { id: 'perfect_day',      name: 'Perfect Day',      description: 'Complete all active hobbies in one day',emoji: '⭐', points: 40 },
  { id: 'days_7',           name: 'Week In',          description: 'Log on 7 different days',               emoji: '📅', points: 20 },
  { id: 'days_30',          name: 'Month In',         description: 'Log on 30 different days',              emoji: '📆', points: 50 },
  { id: 'hobby_variety',    name: 'Collector',        description: 'Track 5 or more hobbies',               emoji: '🎒', points: 20 },
]

export function computeEarnedAchievementIds(data: TrackerData, today: string): string[] {
  const activeHobbies = data.hobbies.filter((h) => h.removedAt === null)
  const allEntries = data.logEntries
  const hobbyMap = new Map(data.hobbies.map((h) => [h.id, h]))

  const completeEntries = allEntries.filter((e) => {
    const hobby = hobbyMap.get(e.hobbyId)
    if (!hobby) return false
    return isEntryComplete(hobby, e)
  })

  const totalCompletions = completeEntries.length
  const uniqueDays = new Set(allEntries.map((e) => e.date)).size

  // Best streak across any currently active hobby (any logged entry counts)
  const maxBestStreak = activeHobbies.reduce((max, hobby) => {
    const dates = new Set(allEntries.filter((e) => e.hobbyId === hobby.id).map((e) => e.date))
    const { best } = streakFromDateSet(dates, today)
    return Math.max(max, best)
  }, 0)

  // Perfect day: any day where all currently active hobbies have complete entries
  const perfectDay = (() => {
    if (activeHobbies.length === 0) return false
    const byDate = new Map<string, Set<string>>()
    for (const e of completeEntries) {
      if (!byDate.has(e.date)) byDate.set(e.date, new Set())
      byDate.get(e.date)!.add(e.hobbyId)
    }
    const activeIds = activeHobbies.map((h) => h.id)
    for (const completed of byDate.values()) {
      if (activeIds.every((id) => completed.has(id))) return true
    }
    return false
  })()

  const earned: string[] = []
  if (allEntries.length > 0)    earned.push('first_log')
  if (maxBestStreak >= 3)       earned.push('streak_3')
  if (maxBestStreak >= 7)       earned.push('streak_7')
  if (maxBestStreak >= 14)      earned.push('streak_14')
  if (maxBestStreak >= 30)      earned.push('streak_30')
  if (totalCompletions >= 10)   earned.push('completions_10')
  if (totalCompletions >= 50)   earned.push('completions_50')
  if (totalCompletions >= 100)  earned.push('completions_100')
  if (totalCompletions >= 500)  earned.push('completions_500')
  if (perfectDay)               earned.push('perfect_day')
  if (uniqueDays >= 7)          earned.push('days_7')
  if (uniqueDays >= 30)         earned.push('days_30')
  if (data.hobbies.length >= 5) earned.push('hobby_variety')

  return earned
}
