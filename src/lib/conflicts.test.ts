import { describe, expect, it } from "vitest"
import { conflictFreeCombos, findConflicts, meetingsOverlap } from "./conflicts"
import type { TimetableEntry } from "./timetable"
import type { DayIndex, Section } from "./courses"

const entry = (sectionId: string, code: string, day: DayIndex, start: number, end: number): TimetableEntry => ({
  sectionId,
  code,
  title: code,
  type: "LEC",
  section: "001",
  termCode: "1265",
  instructor: "Staff",
  meetings: [{ day, start, end, location: "MC" }],
})

describe("meetingsOverlap", () => {
  it("overlaps on the same day with intersecting times", () => {
    expect(meetingsOverlap({ day: 0, start: 600, end: 700, location: "" }, { day: 0, start: 650, end: 720, location: "" })).toBe(true)
  })
  it("does not overlap on different days", () => {
    expect(meetingsOverlap({ day: 0, start: 600, end: 700, location: "" }, { day: 1, start: 600, end: 700, location: "" })).toBe(false)
  })
  it("does not overlap when adjacent (end == start)", () => {
    expect(meetingsOverlap({ day: 0, start: 600, end: 700, location: "" }, { day: 0, start: 700, end: 800, location: "" })).toBe(false)
  })
})

describe("findConflicts", () => {
  it("flags overlapping entries", () => {
    const r = findConflicts([entry("a", "CS 136", 0, 600, 700), entry("b", "MATH 237", 0, 650, 750)])
    expect(r.sectionIds).toEqual(new Set(["a", "b"]))
    expect(r.pairs).toHaveLength(1)
  })
  it("reports no conflicts for a clean schedule", () => {
    const r = findConflicts([entry("a", "CS 136", 0, 600, 700), entry("b", "MATH 237", 0, 700, 800)])
    expect(r.pairs).toHaveLength(0)
  })
})

const section = (id: string, day: DayIndex, start: number, end: number): Section => ({
  id,
  type: "LEC",
  section: id,
  instructor: "Staff",
  enrolled: 0,
  capacity: 100,
  meetings: [{ day, start, end, location: "MC" }],
})

describe("conflictFreeCombos", () => {
  it("finds a combination avoiding the clash", () => {
    const combos = conflictFreeCombos([
      { code: "A", title: "A", sections: [section("A1", 0, 600, 700)] },
      { code: "B", title: "B", sections: [section("B1", 0, 600, 700), section("B2", 0, 700, 800)] },
    ])
    expect(combos.length).toBeGreaterThan(0)
    // Every returned combo must be internally conflict-free.
    for (const combo of combos) {
      const ids = combo.map((c) => c.section.id)
      expect(ids).toContain("A1")
      expect(ids).toContain("B2") // B1 clashes with A1, so B2 must be chosen
    }
  })

  it("returns nothing when no combination works", () => {
    const combos = conflictFreeCombos([
      { code: "A", title: "A", sections: [section("A1", 0, 600, 700)] },
      { code: "B", title: "B", sections: [section("B1", 0, 630, 730)] },
    ])
    expect(combos).toHaveLength(0)
  })
})
