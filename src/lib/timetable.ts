import { useCallback, useEffect, useState } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "./firebase"
import { useAuthUser } from "./useAuthUser"

/**
 * The user's selected section IDs, persisted on their Firestore user doc
 * (`users/{uid}.timetable`). Survives refresh and logout.
 */
export function useTimetable() {
  const { user, loading: authLoading } = useAuthUser()
  const [sectionIds, setSectionIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (authLoading) return
    if (!user) {
      setSectionIds([])
      setLoading(false)
      return
    }
    setLoading(true)
    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (!active) return
        const data = snap.data() as { timetable?: string[] } | undefined
        setSectionIds(Array.isArray(data?.timetable) ? data!.timetable! : [])
      })
      .catch(() => {
        if (active) setSectionIds([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user, authLoading])

  const persist = useCallback(
    async (next: string[]) => {
      setSectionIds(next)
      if (user) {
        await setDoc(doc(db, "users", user.uid), { timetable: next }, { merge: true })
      }
    },
    [user]
  )

  const add = useCallback(
    (id: string) => {
      setSectionIds((prev) => {
        if (prev.includes(id)) return prev
        const next = [...prev, id]
        if (user) setDoc(doc(db, "users", user.uid), { timetable: next }, { merge: true })
        return next
      })
    },
    [user]
  )

  const remove = useCallback(
    (id: string) => {
      setSectionIds((prev) => {
        const next = prev.filter((s) => s !== id)
        if (user) setDoc(doc(db, "users", user.uid), { timetable: next }, { merge: true })
        return next
      })
    },
    [user]
  )

  const has = useCallback((id: string) => sectionIds.includes(id), [sectionIds])

  return { sectionIds, loading: authLoading || loading, add, remove, has, persist }
}
