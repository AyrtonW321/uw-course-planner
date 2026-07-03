import { describe, expect, it } from "vitest"
import { parseTranscript } from "./completed"

describe("parseTranscript", () => {
  it("extracts codes and numeric grades, ignoring unit decimals", () => {
    const text = [
      "Fall 2024",
      "Course Description Attempted Earned Grade",
      "MATH 135 Algebra for Honours Mathematics 0.50 0.50 92",
      "ECON 101 Introduction to Microeconomics 0.50 0.50 78",
      "Term GPA: 3.90",
    ].join("\n")
    expect(parseTranscript(text)).toEqual([
      { code: "MATH 135", grade: 92 },
      { code: "ECON 101", grade: 78 },
    ])
  })

  it("treats CR as completed with no grade", () => {
    expect(parseTranscript("CS 136L Tools and Techniques 0.25 0.25 CR")).toEqual([
      { code: "CS 136L", grade: null },
    ])
  })

  it("skips failed / withdrawn courses", () => {
    expect(parseTranscript("PHYS 121 Mechanics 0.50 0.00 F")).toEqual([])
    expect(parseTranscript("CHEM 120 Chemistry 0.50 0.00 NCR")).toEqual([])
  })

  it("ignores lines without a course code", () => {
    expect(parseTranscript("Cumulative GPA 3.75\nDean's Honours List")).toEqual([])
  })
})
