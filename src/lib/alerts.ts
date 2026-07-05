import { useMemo } from "react"
import { ALL_TERM_IDS, completedTerms, useDegreePlan, type DegreePlan } from "./degreePlan"
import { PASS_THRESHOLD, useCompleted, type CompletedCourse } from "./completed"
import { useProfileMeta } from "./profile"
import { usePrereqIndex } from "./usePrereq"
import type { PrereqClause } from "./requirements"

export type AlertKind = "missing-grade" | "failed" | "prereq-grade"

export type Alert = {
  id: string
  kind: AlertKind
  title: string
  detail: string
  to: string
}

type Params = {
  plan: DegreePlan
  completed: CompletedCourse[]
  currentTerm: string
  resolve: (code: string) => PrereqClause[]
}

/**
 * Everything the student needs to account for, derived from their plan, grades,
 * and current term. Grades are only expected for terms already completed.
 */
export function computeAlerts({ plan, completed, currentTerm, resolve }: Params): Alert[] {
  const alerts: Alert[] = []
  if (!currentTerm) return alerts // can't reason about completion without a current term

  const entry = new Map(completed.map((c) => [c.code, c]))
  const passed = new Set(completed.filter((c) => c.grade === null || c.grade >= PASS_THRESHOLD).map((c) => c.code))
  const numericGrade = new Map(
    completed.filter((c) => typeof c.grade === "number").map((c) => [c.code, c.grade as number])
  )
  const curIdx = ALL_TERM_IDS.indexOf(currentTerm)
  const done = completedTerms(currentTerm)

  // (a) Missing grades for courses in already-completed terms.
  for (const t of done) {
    for (const c of plan[t] ?? []) {
      if (!entry.has(c.code)) {
        alerts.push({
          id: `mg-${t}-${c.code}`,
          kind: "missing-grade",
          title: "Missing grade",
          detail: `Enter your grade for ${c.code} (${t})`,
          to: "/app/planner/completed",
        })
      }
    }
  }

  // (b) Failed courses with no retake planned in the current or a future term.
  for (const c of completed) {
    if (c.grade === null || c.grade >= PASS_THRESHOLD) continue
    const retakePlanned = Object.entries(plan).some(
      ([t, list]) =>
        list.some((x) => x.code === c.code) && curIdx >= 0 && ALL_TERM_IDS.indexOf(t) >= curIdx
    )
    if (!retakePlanned) {
      alerts.push({
        id: `fail-${c.code}`,
        kind: "failed",
        title: `Failed ${c.code}`,
        detail: `${c.code} (${c.grade}%) earns no credit — plan a retake`,
        to: "/app/planner",
      })
    }
  }

  // (c) Prerequisite grade shortfalls for planned courses (e.g. have 59%, need 60%).
  const plannedCodes = new Set(Object.values(plan).flat().map((c) => c.code))
  for (const code of plannedCodes) {
    for (const clause of resolve(code)) {
      const met = clause.some((alt) => {
        if (!passed.has(alt.code)) return false
        if (!alt.minGrade) return true
        const g = numericGrade.get(alt.code)
        return g === undefined ? true : g >= alt.minGrade
      })
      if (met) continue
      for (const alt of clause) {
        if (!alt.minGrade) continue
        const g = numericGrade.get(alt.code)
        if (g !== undefined && g >= PASS_THRESHOLD && g < alt.minGrade) {
          alerts.push({
            id: `pg-${code}-${alt.code}`,
            kind: "prereq-grade",
            title: "Prerequisite grade too low",
            detail: `${code} needs ${alt.code} ≥ ${alt.minGrade}% — you have ${g}%`,
            to: `/app/courses/${encodeURIComponent(code)}`,
          })
        }
      }
    }
  }

  // De-dupe by id.
  const seen = new Set<string>()
  return alerts.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)))
}

export function useAlerts(): Alert[] {
  const { plan } = useDegreePlan()
  const { completed } = useCompleted()
  const { meta } = useProfileMeta()
  const { resolve } = usePrereqIndex()

  return useMemo(
    () => computeAlerts({ plan, completed, currentTerm: meta?.currentTerm ?? "", resolve }),
    [plan, completed, meta?.currentTerm, resolve]
  )
}
