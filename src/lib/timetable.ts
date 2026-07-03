import { useCallback, useMemo } from "react"
import { useUserDoc } from "./userDoc"
import type { Meeting, SectionType } from "./courses"

/**
 * A saved section, denormalized so the timetable can render without re-fetching
 * the catalog. Stored on the user's Firestore doc (`users/{uid}.timetable`),
 * so it survives refresh and logout.
 */
export type TimetableEntry = {
  sectionId: string
  code: string
  title: string
  type: SectionType
  section: string
  termCode: string
  /** Academic term this entry belongs to (e.g. "1A"), for per-term timetables. */
  term?: string
  instructor: string
  meetings: Meeting[]
}

export function useTimetable() {
  const { data, loading, update } = useUserDoc()

  const entries = useMemo<TimetableEntry[]>(
    () => (Array.isArray(data?.timetable) ? (data!.timetable as TimetableEntry[]) : []),
    [data]
  )

  const persist = useCallback(
    (next: TimetableEntry[]) => update({ timetable: next }),
    [update]
  )

  const add = useCallback(
    (entry: TimetableEntry) => {
      if (entries.some((e) => e.sectionId === entry.sectionId)) return
      persist([...entries, entry])
    },
    [entries, persist]
  )

  const remove = useCallback(
    (sectionId: string) => persist(entries.filter((e) => e.sectionId !== sectionId)),
    [entries, persist]
  )

  const has = useCallback(
    (sectionId: string) => entries.some((e) => e.sectionId === sectionId),
    [entries]
  )

  return { entries, loading, add, remove, has, persist }
}
