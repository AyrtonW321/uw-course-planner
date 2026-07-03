import { describe, expect, it } from "vitest"
import { ALL_TERM_IDS, movePlanned, termProgressPct, type DegreePlan } from "./degreePlan"

const c = (code: string) => ({ code, name: code })

describe("termProgressPct", () => {
  it("maps current term to fraction of 8 terms completed", () => {
    expect(termProgressPct("1A")).toBe(0)
    expect(termProgressPct("2A")).toBe(25)
    expect(termProgressPct("3A")).toBe(50)
    expect(termProgressPct("4A")).toBe(75)
    expect(termProgressPct("")).toBe(0)
    expect(termProgressPct("ZZ")).toBe(0)
  })

  it("covers all eight academic terms", () => {
    expect(ALL_TERM_IDS).toEqual(["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B"])
  })
})

describe("movePlanned", () => {
  it("moves a course to another term", () => {
    const plan: DegreePlan = { "1A": [c("CS 135")], "1B": [] }
    const next = movePlanned(plan, "1A", "1B", "CS 135")
    expect(next["1A"]).toEqual([])
    expect(next["1B"]).toEqual([c("CS 135")])
  })

  it("reorders within a term without off-by-one when moving down", () => {
    const plan: DegreePlan = { "1A": [c("A"), c("B"), c("C")] }
    // Drag A to the slot before C (index 2 measured in original list).
    const next = movePlanned(plan, "1A", "1A", "A", 2)
    expect(next["1A"].map((x) => x.code)).toEqual(["B", "A", "C"])
  })

  it("does not duplicate a course already in the target term", () => {
    const plan: DegreePlan = { "1A": [c("CS 135")], "1B": [c("CS 135")] }
    const next = movePlanned(plan, "1A", "1B", "CS 135")
    expect(next).toBe(plan) // unchanged
  })

  it("returns the same plan when the course isn't found", () => {
    const plan: DegreePlan = { "1A": [] }
    expect(movePlanned(plan, "1A", "1B", "NOPE")).toBe(plan)
  })
})
