import { describe, expect, it } from "vitest"
import { parsePrereqClauses } from "./prereqParser"

const codes = (clauses: ReturnType<typeof parsePrereqClauses>) =>
  clauses.map((c) => c.map((a) => a.code + (a.minGrade ? `:${a.minGrade}` : "")))

describe("parsePrereqClauses", () => {
  it("parses a single OR clause with per-course grades", () => {
    const r = parsePrereqClauses(
      "Prereq: One of CS 145, at least 90% in CS 115, at least 70% in CS 116, at least 60% in CS 135. Coreq: CS 136L."
    )
    expect(codes(r)).toEqual([["CS 145", "CS 115:90", "CS 116:70", "CS 135:60"]])
  })

  it("shares a single parenthesized grade across its courses", () => {
    const r = parsePrereqClauses(
      "Prereq: (MATH 106 or 114 or 115 with a grade of at least 70%) or (MATH 136 with a grade of at least 60%) or MATH 146; Honours Mathematics students."
    )
    expect(codes(r)).toEqual([
      ["MATH 106:70", "MATH 114:70", "MATH 115:70", "MATH 136:60", "MATH 146"],
    ])
  })

  it("splits AND clauses and keeps per-course grades (no blanket)", () => {
    const r = parsePrereqClauses(
      "Prereq: (One of MATH 106, 114, 115, 136, 146) and (MATH 128 with at least 70% or MATH 138 with at least 60% or MATH 148); Honours Math students."
    )
    expect(codes(r)).toEqual([
      ["MATH 106", "MATH 114", "MATH 115", "MATH 136", "MATH 146"],
      ["MATH 128:70", "MATH 138:60", "MATH 148"],
    ])
  })

  it("excludes coreq and antireq courses", () => {
    const r = parsePrereqClauses(
      "Prereq: MATH 135 or 145. Coreq: MATH 136L. Antireq: MATH 225, 245"
    )
    expect(codes(r)).toEqual([["MATH 135", "MATH 145"]])
  })

  it("returns nothing when there is no requirements text", () => {
    expect(parsePrereqClauses(undefined)).toEqual([])
    expect(parsePrereqClauses("")).toEqual([])
  })

  it("does not scan course codes out of prose when there is no Prereq: label", () => {
    const r = parsePrereqClauses(
      "Continuation of CS 246. Antireq: CS 247. Students may not receive credit for both."
    )
    expect(codes(r)).toEqual([])
  })
})
