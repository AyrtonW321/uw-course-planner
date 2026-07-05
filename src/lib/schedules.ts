import { useCallback, useMemo } from "react"
import { useUserDoc } from "./userDoc"
import type { TimetableEntry } from "./timetable"

/** A named snapshot of a term's timetable, for saving and comparing variants. */
export type SavedSchedule = {
  id: string
  name: string
  term: string
  entries: TimetableEntry[]
  savedAt: number
}

export function useSchedules() {
  const { data, loading, update } = useUserDoc()

  const schedules = useMemo<SavedSchedule[]>(
    () => (Array.isArray(data?.savedSchedules) ? (data!.savedSchedules as SavedSchedule[]) : []),
    [data]
  )

  const persist = useCallback(
    (next: SavedSchedule[]) => update({ savedSchedules: next }),
    [update]
  )

  const save = useCallback(
    (name: string, term: string, entries: TimetableEntry[]) => {
      const snapshot: SavedSchedule = {
        id: `sch-${Date.now()}`,
        name: name.trim() || `${term} schedule`,
        term,
        entries,
        savedAt: Date.now(),
      }
      persist([...schedules, snapshot])
      return snapshot
    },
    [schedules, persist]
  )

  const remove = useCallback(
    (id: string) => persist(schedules.filter((s) => s.id !== id)),
    [schedules, persist]
  )

  return { schedules, loading, save, remove }
}
