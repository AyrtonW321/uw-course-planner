import { useCallback, useMemo } from "react"
import { useUserDoc } from "./userDoc"
import type { PlannedCourse } from "./degreePlan"

export type SlotType = "study" | "work" | "off"

export type CoopSlot = {
  id: string
  type: SlotType
  /** Academic term (1A…) for study, work-term id (WT1…) for work, label for off. */
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
const off = (label: string): CoopSlot => ({ id: label, type: "off", label })

/**
 * The four official UW Mathematics entry-level co-op sequences (SEQ 1–4),
 * plus a Regular (non-co-op) option.
 * Source: uwaterloo.ca/new-math-students/co-op/sequence-charts
 */
export const COOP_SEQUENCES: CoopSequence[] = [
  {
    id: "seq1",
    label: "Sequence 1",
    description: "Most common. Work terms alternate with study from 1B onward.",
    slots: [
      study("1A"), study("1B"), work("WT1"),
      study("2A"), work("WT2"), study("2B"), work("WT3"),
      study("3A"), work("WT4"), study("3B"), work("WT5"),
      study("4A"), work("WT6"), study("4B"),
    ],
  },
  {
    id: "seq2",
    label: "Sequence 2",
    description: "Earlier access to upper-year courses; includes a longer work term.",
    slots: [
      study("1A"), study("1B"), work("WT1"),
      study("2A"), study("2B"), work("WT2"),
      study("3A"), work("WT3"), study("3B"), work("WT4"),
      study("4A"), work("WT5"), work("WT6"), study("4B"),
    ],
  },
  {
    id: "seq3",
    label: "Sequence 3",
    description: "Delays work terms to year two; an off term in first year.",
    slots: [
      study("1A"), study("1B"), off("Off"),
      study("2A"), work("WT1"), study("2B"), work("WT2"),
      study("3A"), work("WT3"), study("3B"), work("WT4"),
      study("4A"), work("WT5"), work("WT6"), study("4B"),
    ],
  },
  {
    id: "seq4",
    label: "Sequence 4",
    description: "First work term delayed until year two; no first-year off term.",
    slots: [
      study("1A"), study("1B"), study("2A"), work("WT1"),
      study("2B"), work("WT2"), study("3A"), work("WT3"),
      study("3B"), work("WT4"), study("4A"), work("WT5"),
      work("WT6"), study("4B"),
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

export function defaultSequenceId(coop: "yes" | "no" | undefined): string {
  return coop === "no" ? "regular" : "seq1"
}

export type WorkRecord = {
  status: "employed" | "unemployed"
  employer?: string
}

export type CoopPlan = {
  sequenceId: string
  /** When set, this user-customized ordering overrides the template. */
  slots?: CoopSlot[]
  work: Record<string, WorkRecord>
  onlineCourses: Record<string, PlannedCourse[]>
}

const EMPTY: CoopPlan = { sequenceId: "seq1", work: {}, onlineCourses: {} }

/** The active ordered slots: custom if present, else the template's. */
export function effectiveSlots(plan: CoopPlan): CoopSlot[] {
  return plan.slots && plan.slots.length ? plan.slots : getSequence(plan.sequenceId).slots
}

export function useCoopPlan() {
  const { data, loading, update } = useUserDoc()

  const plan = useMemo<CoopPlan>(() => {
    const d = data?.coopPlan as Partial<CoopPlan> | undefined
    return {
      sequenceId: d?.sequenceId ?? EMPTY.sequenceId,
      slots: d?.slots,
      work: d?.work ?? {},
      onlineCourses: d?.onlineCourses ?? {},
    }
  }, [data])

  const persist = useCallback((next: CoopPlan) => update({ coopPlan: next }), [update])

  // Choosing a stream resets the editable slots to that template.
  const setSequence = useCallback(
    (sequenceId: string) =>
      persist({ ...plan, sequenceId, slots: getSequence(sequenceId).slots.map((s) => ({ ...s })) }),
    [plan, persist]
  )

  const setSlots = useCallback(
    (slots: CoopSlot[]) => persist({ ...plan, slots }),
    [plan, persist]
  )

  const reorderSlots = useCallback(
    (from: number, to: number) => {
      const slots = effectiveSlots(plan).map((s) => ({ ...s }))
      if (from < 0 || from >= slots.length || to < 0 || to >= slots.length) return
      const [moved] = slots.splice(from, 1)
      slots.splice(to, 0, moved)
      persist({ ...plan, slots })
    },
    [plan, persist]
  )

  const addWorkTerm = useCallback(() => {
    const slots = effectiveSlots(plan).map((s) => ({ ...s }))
    const n = slots.filter((s) => s.type === "work").length + 1
    slots.push({ id: `WT-${crypto.randomUUID()}`, type: "work", label: `WT${n}` })
    persist({ ...plan, slots })
  }, [plan, persist])

  const removeSlot = useCallback(
    (id: string) => {
      const slots = effectiveSlots(plan)
        .filter((s) => s.id !== id)
        .map((s) => ({ ...s }))
      persist({ ...plan, slots })
    },
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
    slots: effectiveSlots(plan),
    loading,
    setSequence,
    setSlots,
    reorderSlots,
    addWorkTerm,
    removeSlot,
    setWork,
    addOnlineCourse,
    removeOnlineCourse,
  }
}
