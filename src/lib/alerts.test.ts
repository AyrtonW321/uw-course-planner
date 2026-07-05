import { describe, expect, it } from "vitest"
import { computeAlerts } from "./alerts"
import type { DegreePlan } from "./degreePlan"
import type { CompletedCourse } from "./completed"
import type { PrereqClause } from "./requirements"

const c = (code: string) => ({ code, name: code })
const noPrereqs = () => [] as PrereqClause[]

describe("computeAlerts", () => {
  it("returns nothing without a current term", () => {
    const plan: DegreePlan = { "1A": [c("CS 135")] }
    expect(computeAlerts({ plan, completed: [], currentTerm: "", resolve: noPrereqs })).toEqual([])
  })

  it("flags missing grades for completed terms only", () => {
    const plan: DegreePlan = { "1A": [c("CS 135")], "2A": [c("CS 246")] }
    const alerts = computeAlerts({ plan, completed: [], currentTerm: "2A", resolve: noPrereqs })
    // 1A is completed (needs grade); 2A is current (does not).
    expect(alerts.some((a) => a.kind === "missing-grade" && a.detail.includes("CS 135"))).toBe(true)
    expect(alerts.some((a) => a.detail.includes("CS 246"))).toBe(false)
  })

  it("flags a failed course with no planned retake", () => {
    const plan: DegreePlan = { "1A": [c("CS 135")] }
    const completed: CompletedCourse[] = [{ code: "CS 135", grade: 39 }]
    const alerts = computeAlerts({ plan, completed, currentTerm: "2A", resolve: noPrereqs })
    expect(alerts.some((a) => a.kind === "failed" && a.detail.includes("CS 135"))).toBe(true)
  })

  it("does not flag a failed course when a retake is planned in the future", () => {
    const plan: DegreePlan = { "1A": [c("CS 135")], "2A": [c("CS 135")] }
    const completed: CompletedCourse[] = [{ code: "CS 135", grade: 39 }]
    const alerts = computeAlerts({ plan, completed, currentTerm: "2A", resolve: noPrereqs })
    expect(alerts.some((a) => a.kind === "failed")).toBe(false)
  })

  it("flags a prerequisite grade shortfall (have 59, need 60)", () => {
    const plan: DegreePlan = { "2A": [c("MATH 235")] }
    const completed: CompletedCourse[] = [{ code: "MATH 136", grade: 59 }]
    const resolve = (code: string): PrereqClause[] =>
      code === "MATH 235" ? [[{ code: "MATH 136", minGrade: 60 }]] : []
    const alerts = computeAlerts({ plan, completed, currentTerm: "2A", resolve })
    expect(alerts.some((a) => a.kind === "prereq-grade" && a.detail.includes("≥ 60%"))).toBe(true)
  })
})
