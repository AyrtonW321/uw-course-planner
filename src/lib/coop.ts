import { useCallback, useEffect, useState } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "./firebase"
import { useAuthUser } from "./useAuthUser"
import type { PlannedCourse } from "./degreePlan"

export type SlotType = "study" | "work"

export type CoopSlot = {
  id: string
  type: SlotType
  /** Academic term id (1A…) for study slots, or work-term id (WT1…). */
  label: string
}

export type CoopSequence = {
  id: string
  label: string
  description: string
  slots: CoopSlot[]
}

const study = (label: string): CoopSlot => ({ id: label, type: "study", label })
const work = (label: string): CoopSlot => ({ id: label, type: "work", label })

/**
 * Representative Math co-op sequences. Different programs default to different
 * streams; users can switch. (Streams modelled from typical UW Math patterns.)
 */
export const COOP_SEQUENCES: CoopSequence[] = [
  {
    id: "stream4",
    label: "Stream 4",
    description: "Work terms begin after 1B — the most common Math stream.",
    slots: [
      study("1A"), study("1B"), work("WT1"),
      study("2A"), work("WT2"), study("2B"), work("WT3"),
      study("3A"), work("WT4"), study("3B"), work("WT5"),
      study("4A"), study("4B"),
    ],
  },
  {
    id: "stream8",
    label: "Stream 8",
    description: "First two study terms together, then alternating work/study.",
    slots: [
      study("1A"), study("1B"), study("2A"), work("WT1"),
      study("2B"), work("WT2"), study("3A"), work("WT3"),
      study("3B"), work("WT4"), study("4A"), study("4B"),
    ],
  },
  {
    id: "regular",
    label: "Regular (no co-op)",
    description: "Eight consecutive study terms, no work terms.",
    slots: [
      study("1A"), study("1B"), study("2A"), study("2B"),
      study("3A"), study("3B"), study("4A"), study("4B"),
    ],
  },
]

export function getSequence(id: string | undefined): CoopSequence {
  return COOP_SEQUENCES.find((s) => s.id === id) ?? COOP_SEQUENCES[0]
}

/** Persist just the chosen sequence (used during onboarding). */
export async function saveCoopSequence(uid: string, sequenceId: string) {
  await setDoc(doc(db, "users", uid), { coopPlan: { sequenceId } }, { merge: true })
}

export function defaultSequenceId(coop: "yes" | "no" | undefined): string {
  return coop === "no" ? "regular" : "stream4"
}

export type WorkRecord = {
  status: "employed" | "unemployed"
  employer?: string
}

export type CoopPlan = {
  sequenceId: string
  work: Record<string, WorkRecord>
  onlineCourses: Record<string, PlannedCourse[]>
}

const EMPTY: CoopPlan = { sequenceId: "stream4", work: {}, onlineCourses: {} }

export function useCoopPlan() {
  const { user, loading: authLoading } = useAuthUser()
  const [plan, setPlan] = useState<CoopPlan>(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (authLoading) return
    if (!user) {
      setPlan(EMPTY)
      setLoading(false)
      return
    }
    setLoading(true)
    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (!active) return
        const d = snap.data() as { coopPlan?: Partial<CoopPlan> } | undefined
        setPlan({
          sequenceId: d?.coopPlan?.sequenceId ?? EMPTY.sequenceId,
          work: d?.coopPlan?.work ?? {},
          onlineCourses: d?.coopPlan?.onlineCourses ?? {},
        })
      })
      .catch(() => active && setPlan(EMPTY))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user, authLoading])

  const persist = useCallback(
    (next: CoopPlan) => {
      setPlan(next)
      if (user) setDoc(doc(db, "users", user.uid), { coopPlan: next }, { merge: true })
    },
    [user]
  )

  const setSequence = useCallback(
    (sequenceId: string) => persist({ ...plan, sequenceId }),
    [plan, persist]
  )

  const setWork = useCallback(
    (slotId: string, record: WorkRecord) =>
      persist({ ...plan, work: { ...plan.work, [slotId]: record } }),
    [plan, persist]
  )

  const addOnlineCourse = useCallback(
    (slotId: string, course: PlannedCourse) => {
      const list = plan.onlineCourses[slotId] ?? []
      if (list.some((c) => c.code === course.code)) return
      persist({
        ...plan,
        onlineCourses: { ...plan.onlineCourses, [slotId]: [...list, course] },
      })
    },
    [plan, persist]
  )

  const removeOnlineCourse = useCallback(
    (slotId: string, code: string) => {
      const list = plan.onlineCourses[slotId] ?? []
      persist({
        ...plan,
        onlineCourses: { ...plan.onlineCourses, [slotId]: list.filter((c) => c.code !== code) },
      })
    },
    [plan, persist]
  )

  return {
    plan,
    loading: authLoading || loading,
    setSequence,
    setWork,
    addOnlineCourse,
    removeOnlineCourse,
  }
}
