import { useMemo } from "react"
import { PASS_THRESHOLD, useCompleted, type CompletedCourse } from "./completed"
import { useDegreePlan, type DegreePlan } from "./degreePlan"

export type AcademicRecord = {
  /** Codes passed in at least one occurrence (a pass anywhere counts). */
  passedCodes: Set<string>
  /** Codes with a failing occurrence and NO passing occurrence. */
  failedCodes: Set<string>
  /** Best (highest) passing grade per code — used for prerequisite cutoffs. */
  bestGrades: Map<string, number>
}

/**
 * Combine per-occurrence plan grades with standalone completed courses.
 * A course is passed if ANY occurrence passes; a prerequisite grade check uses
 * the BEST passing grade (so a later pass overrides an earlier fail).
 */
export function deriveRecord(plan: DegreePlan, completed: CompletedCourse[]): AcademicRecord {
  const gradesByCode = new Map<string, (number | null)[]>()
  const push = (code: string, grade: number | null) => {
    const arr = gradesByCode.get(code) ?? []
    arr.push(grade)
    gradesByCode.set(code, arr)
  }

  for (const list of Object.values(plan)) {
    for (const c of list) if (c.grade !== undefined) push(c.code, c.grade)
  }
  for (const c of completed) push(c.code, c.grade)

  const passedCodes = new Set<string>()
  const failedCodes = new Set<string>()
  const bestGrades = new Map<string, number>()

  for (const [code, grades] of gradesByCode) {
    let hasPass = false
    let hasFail = false
    let best: number | undefined
    for (const g of grades) {
      if (g === null) hasPass = true // CR
      else if (g >= PASS_THRESHOLD) {
        hasPass = true
        best = best === undefined ? g : Math.max(best, g)
      } else hasFail = true
    }
    if (hasPass) passedCodes.add(code)
    if (hasFail && !hasPass) failedCodes.add(code)
    if (best !== undefined) bestGrades.set(code, best)
  }

  return { passedCodes, failedCodes, bestGrades }
}

export function useAcademicRecord(): AcademicRecord {
  const { plan } = useDegreePlan()
  const { completed } = useCompleted()
  return useMemo(() => deriveRecord(plan, completed), [plan, completed])
}
