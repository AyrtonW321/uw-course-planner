import { useCallback, useMemo } from "react"
import { useUserDoc } from "./userDoc"

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

/** Academic terms strictly before the current one — i.e. already completed. */
export function completedTerms(currentTerm: string | undefined | null): string[] {
  if (!currentTerm) return []
  const i = ALL_TERM_IDS.indexOf(currentTerm)
  return i <= 0 ? [] : ALL_TERM_IDS.slice(0, i)
}

/** Format a unit total exactly (no rounding), trimming trailing zeros: 5.75, 13. */
export function fmtUnits(n: number): string {
  return String(Math.round(n * 100) / 100)
}

/** Pure move helper — reused by the hook and unit-tested. */
export function movePlanned(
  plan: DegreePlan,
  fromTerm: string,
  toTerm: string,
  code: string,
  index?: number
): DegreePlan {
  const course = (plan[fromTerm] ?? []).find((c) => c.code === code)
  if (!course) return plan

  if (fromTerm === toTerm) {
    const fromIndex = (plan[toTerm] ?? []).findIndex((c) => c.code === code)
    const list = (plan[toTerm] ?? []).filter((c) => c.code !== code)
    // The drop index was measured against the original list (which still
    // contained the dragged item), so shift down by one when moving later.
    let at = index === undefined ? list.length : index
    if (index !== undefined && fromIndex !== -1 && index > fromIndex) at -= 1
    at = Math.max(0, Math.min(at, list.length))
    list.splice(at, 0, course)
    return { ...plan, [toTerm]: list }
  }

  if ((plan[toTerm] ?? []).some((c) => c.code === code)) return plan
  const toList = [...(plan[toTerm] ?? [])]
  const at = index === undefined ? toList.length : Math.max(0, Math.min(index, toList.length))
  toList.splice(at, 0, course)
  return {
    ...plan,
    [fromTerm]: (plan[fromTerm] ?? []).filter((c) => c.code !== code),
    [toTerm]: toList,
  }
}

export function useDegreePlan() {
  const { data, loading, update } = useUserDoc()

  const plan = useMemo<DegreePlan>(
    () => (data?.degreePlan as DegreePlan) ?? {},
    [data]
  )

  const save = useCallback((next: DegreePlan) => update({ degreePlan: next }), [update])

  const addCourse = useCallback(
    (termId: string, course: PlannedCourse) => {
      const list = plan[termId] ?? []
      if (list.some((c) => c.code === course.code)) return
      save({ ...plan, [termId]: [...list, course] })
    },
    [plan, save]
  )

  const removeCourse = useCallback(
    (termId: string, code: string) =>
      save({ ...plan, [termId]: (plan[termId] ?? []).filter((c) => c.code !== code) }),
    [plan, save]
  )

  /** Move a course to a target term at a specific index (drag and drop). */
  const moveCourse = useCallback(
    (fromTerm: string, toTerm: string, code: string, index?: number) => {
      const next = movePlanned(plan, fromTerm, toTerm, code, index)
      if (next !== plan) save(next)
    },
    [plan, save]
  )

  const totalCourses = Object.values(plan).reduce((n, list) => n + list.length, 0)

  return { plan, loading, addCourse, removeCourse, moveCourse, save, totalCourses }
}
