import { useCallback, useEffect, useState } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "./firebase"
import { useAuthUser } from "./useAuthUser"

export type PlannedCourse = {
  code: string
  name: string
}

/** Map of term id ("1A", "1B", "2A"…) → planned courses for that term. */
export type DegreePlan = Record<string, PlannedCourse[]>

/** Academic terms grouped by year. Co-op work terms are planned elsewhere. */
export const PLAN_YEARS: { year: number; terms: { id: string; label: string }[] }[] = [
  { year: 1, terms: [{ id: "1A", label: "1A" }, { id: "1B", label: "1B" }] },
  { year: 2, terms: [{ id: "2A", label: "2A" }, { id: "2B", label: "2B" }] },
  { year: 3, terms: [{ id: "3A", label: "3A" }, { id: "3B", label: "3B" }] },
  { year: 4, terms: [{ id: "4A", label: "4A" }, { id: "4B", label: "4B" }] },
]

export const ALL_TERM_IDS = PLAN_YEARS.flatMap((y) => y.terms.map((t) => t.id))

/**
 * Degree progress from the student's current term: the fraction of the eight
 * academic terms already completed. Being *in* 1A means 0 terms done (0%);
 * being in 3A (index 4) means 4/8 = 50%; after 4B → 100%.
 */
export function termProgressPct(currentTerm: string | undefined | null): number {
  if (!currentTerm) return 0
  const i = ALL_TERM_IDS.indexOf(currentTerm)
  if (i < 0) return 0
  return Math.round((i / ALL_TERM_IDS.length) * 100)
}

export function useDegreePlan() {
  const { user, loading: authLoading } = useAuthUser()
  const [plan, setPlan] = useState<DegreePlan>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (authLoading) return
    if (!user) {
      setPlan({})
      setLoading(false)
      return
    }
    setLoading(true)
    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (!active) return
        const data = snap.data() as { degreePlan?: DegreePlan } | undefined
        setPlan(data?.degreePlan ?? {})
      })
      .catch(() => active && setPlan({}))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user, authLoading])

  const save = useCallback(
    (next: DegreePlan) => {
      setPlan(next)
      if (user) {
        setDoc(doc(db, "users", user.uid), { degreePlan: next }, { merge: true })
      }
    },
    [user]
  )

  const addCourse = useCallback(
    (termId: string, course: PlannedCourse) => {
      setPlan((prev) => {
        const list = prev[termId] ?? []
        if (list.some((c) => c.code === course.code)) return prev
        const next = { ...prev, [termId]: [...list, course] }
        if (user) setDoc(doc(db, "users", user.uid), { degreePlan: next }, { merge: true })
        return next
      })
    },
    [user]
  )

  const removeCourse = useCallback(
    (termId: string, code: string) => {
      setPlan((prev) => {
        const next = { ...prev, [termId]: (prev[termId] ?? []).filter((c) => c.code !== code) }
        if (user) setDoc(doc(db, "users", user.uid), { degreePlan: next }, { merge: true })
        return next
      })
    },
    [user]
  )

  /**
   * Move a course to a target term at a specific index (drag and drop).
   * Handles both cross-term moves and reordering within the same term.
   */
  const moveCourse = useCallback(
    (fromTerm: string, toTerm: string, code: string, index?: number) => {
      setPlan((prev) => {
        const course = (prev[fromTerm] ?? []).find((c) => c.code === code)
        if (!course) return prev

        if (fromTerm === toTerm) {
          const list = (prev[toTerm] ?? []).filter((c) => c.code !== code)
          const at = index === undefined ? list.length : Math.min(index, list.length)
          list.splice(at, 0, course)
          const next = { ...prev, [toTerm]: list }
          if (user) setDoc(doc(db, "users", user.uid), { degreePlan: next }, { merge: true })
          return next
        }

        if ((prev[toTerm] ?? []).some((c) => c.code === code)) return prev
        const toList = [...(prev[toTerm] ?? [])]
        const at = index === undefined ? toList.length : Math.min(index, toList.length)
        toList.splice(at, 0, course)
        const next = {
          ...prev,
          [fromTerm]: (prev[fromTerm] ?? []).filter((c) => c.code !== code),
          [toTerm]: toList,
        }
        if (user) setDoc(doc(db, "users", user.uid), { degreePlan: next }, { merge: true })
        return next
      })
    },
    [user]
  )

  const totalCourses = Object.values(plan).reduce((n, list) => n + list.length, 0)

  return { plan, loading: authLoading || loading, addCourse, removeCourse, moveCourse, save, totalCourses }
}
