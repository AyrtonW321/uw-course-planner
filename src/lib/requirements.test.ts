import { describe, expect, it } from "vitest"
import { estimateCredit, isMathCourse, statusForClauses } from "./requirements"

describe("statusForClauses", () => {
  const have = (...codes: string[]) => new Set(codes)

  it("is met with no clauses", () => {
    expect(statusForClauses([], have())).toBe("met")
  })

  it("is met when a plain alternative is satisfied", () => {
    expect(statusForClauses([[{ code: "MATH 137" }, { code: "MATH 147" }]], have("MATH 137"))).toBe("met")
  })

  it("does not flag an OR alternative you didn't take", () => {
    // Have 137, don't have 147 — still met (they're alternatives).
    const clause = [[{ code: "MATH 137" }, { code: "MATH 147" }]]
    expect(statusForClauses(clause, have("MATH 137"))).toBe("met")
  })

  it("is yellow when satisfied only via a grade-required alternative", () => {
    const clause = [[{ code: "MATH 136", minGrade: 60 }, { code: "MATH 146" }]]
    expect(statusForClauses(clause, have("MATH 136"))).toBe("grade")
  })

  it("is missing when no alternative is satisfied", () => {
    const clause = [[{ code: "MATH 137" }, { code: "MATH 147" }]]
    expect(statusForClauses(clause, have())).toBe("missing")
  })

  it("ANDs clauses: missing if any clause unsatisfied", () => {
    const clauses = [[{ code: "MATH 136" }], [{ code: "MATH 138" }]]
    expect(statusForClauses(clauses, have("MATH 136"))).toBe("missing")
    expect(statusForClauses(clauses, have("MATH 136", "MATH 138"))).toBe("met")
  })
})

describe("credit helpers", () => {
  it("treats labs as 0.25 units", () => {
    expect(estimateCredit("CS 136L")).toBe(0.25)
    expect(estimateCredit("CS 136")).toBe(0.5)
  })

  it("classifies math vs non-math subjects", () => {
    expect(isMathCourse("AMATH 231")).toBe(true)
    expect(isMathCourse("ENGL 109")).toBe(false)
  })
})
