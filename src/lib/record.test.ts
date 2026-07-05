import { describe, expect, it } from "vitest"
import { deriveRecord } from "./record"
import type { DegreePlan } from "./degreePlan"

describe("deriveRecord", () => {
  it("treats occurrences independently — a pass anywhere counts", () => {
    // CS 135 failed in 1A but retaken and passed in 1B.
    const plan: DegreePlan = {
      "1A": [{ code: "CS 135", name: "x", grade: 39 }],
      "1B": [{ code: "CS 135", name: "x", grade: 72 }],
    }
    const r = deriveRecord(plan, [])
    expect(r.passedCodes.has("CS 135")).toBe(true)
    expect(r.failedCodes.has("CS 135")).toBe(false)
    // Prerequisite checks use the passing grade, not the failing one.
    expect(r.bestGrades.get("CS 135")).toBe(72)
  })

  it("marks a course failed only when it never passed", () => {
    const plan: DegreePlan = { "1A": [{ code: "CS 135", name: "x", grade: 39 }] }
    const r = deriveRecord(plan, [])
    expect(r.failedCodes.has("CS 135")).toBe(true)
    expect(r.passedCodes.has("CS 135")).toBe(false)
    expect(r.bestGrades.has("CS 135")).toBe(false)
  })

  it("ignores occurrences without a grade", () => {
    const plan: DegreePlan = { "3A": [{ code: "STAT 231", name: "x" }] }
    const r = deriveRecord(plan, [])
    expect(r.passedCodes.size).toBe(0)
    expect(r.failedCodes.size).toBe(0)
  })

  it("counts CR (null grade) as a pass", () => {
    const r = deriveRecord({ "1A": [{ code: "PD 1", name: "x", grade: null }] }, [])
    expect(r.passedCodes.has("PD 1")).toBe(true)
  })
})
