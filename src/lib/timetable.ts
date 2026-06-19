import { useCallback, useEffect, useState } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "./firebase"
import { useAuthUser } from "./useAuthUser"
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
  instructor: string
  meetings: Meeting[]
}

export function useTimetable() {
  const { user, loading: authLoading } = useAuthUser()
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (authLoading) return
    if (!user) {
      setEntries([])
      setLoading(false)
      return
    }
    setLoading(true)
    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (!active) return
        const data = snap.data() as { timetable?: TimetableEntry[] } | undefined
        setEntries(Array.isArray(data?.timetable) ? data!.timetable! : [])
      })
      .catch(() => {
        if (active) setEntries([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user, authLoading])

  const persist = useCallback(
    (next: TimetableEntry[]) => {
      setEntries(next)
      if (user) {
        setDoc(doc(db, "users", user.uid), { timetable: next }, { merge: true })
      }
    },
    [user]
  )

  const add = useCallback(
    (entry: TimetableEntry) => {
      setEntries((prev) => {
        if (prev.some((e) => e.sectionId === entry.sectionId)) return prev
        const next = [...prev, entry]
        if (user) setDoc(doc(db, "users", user.uid), { timetable: next }, { merge: true })
        return next
      })
    },
    [user]
  )

  const remove = useCallback(
    (sectionId: string) => {
      setEntries((prev) => {
        const next = prev.filter((e) => e.sectionId !== sectionId)
        if (user) setDoc(doc(db, "users", user.uid), { timetable: next }, { merge: true })
        return next
      })
    },
    [user]
  )

  const has = useCallback(
    (sectionId: string) => entries.some((e) => e.sectionId === sectionId),
    [entries]
  )

  return { entries, loading: authLoading || loading, add, remove, has, persist }
}
