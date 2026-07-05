import { describe, expect, it } from "vitest"
import { matchSections, parseQuestDays, parseQuestSchedule } from "./questImport"
import type { Section } from "./courses"

describe("parseQuestDays", () => {
  it("parses compact day clusters", () => {
    expect(parseQuestDays("MWF")).toEqual([0, 2, 4])
    expect(parseQuestDays("TTh")).toEqual([1, 3])
    expect(parseQuestDays("Mo We Fr")).toEqual([0, 2, 4])
  })
})

describe("parseQuestSchedule", () => {
  it("extracts meetings under each course header", () => {
    const text = [
      "MATH 237 - Calculus 3 for Honours Mathematics",
      "Class Nbr Section Component Days & Times Room Instructor",
      "5301 001 LEC MWF 12:30PM - 1:20PM MC 4020 Sean New",
      "CS 136 - Elementary Algorithm Design and Data Abstraction",
      "3715 001 LEC TTh 1:00PM - 2:20PM MC 4045 B Lushman",
      "4713 102 TUT W 11:30AM - 12:20PM MC 2034",
    ].join("\n")

    const parsed = parseQuestSchedule(text)
    expect(parsed).toContainEqual({ code: "MATH 237", day: 0, start: 750, end: 800 })
    expect(parsed).toContainEqual({ code: "MATH 237", day: 2, start: 750, end: 800 })
    expect(parsed).toContainEqual({ code: "MATH 237", day: 4, start: 750, end: 800 })
    expect(parsed).toContainEqual({ code: "CS 136", day: 1, start: 780, end: 860 })
    expect(parsed).toContainEqual({ code: "CS 136", day: 3, start: 780, end: 860 })
    expect(parsed).toContainEqual({ code: "CS 136", day: 2, start: 690, end: 740 })
  })
})

const section = (id: string, type: string, meetings: Section["meetings"]): Section => ({
  id,
  type,
  section: id,
  instructor: "Staff",
  enrolled: 0,
  capacity: 100,
  meetings,
})

describe("matchSections", () => {
  it("selects sections whose meetings are all present in the parsed schedule", () => {
    const parsed = parseQuestSchedule("CS 136 - x\nLEC MWF 1:00PM - 2:20PM\nTUT W 11:30AM - 12:20PM")
    const sections = [
      section("LEC001", "LEC", [
        { day: 0, start: 780, end: 860, location: "MC" },
        { day: 2, start: 780, end: 860, location: "MC" },
        { day: 4, start: 780, end: 860, location: "MC" },
      ]),
      section("LEC002", "LEC", [{ day: 1, start: 600, end: 680, location: "MC" }]),
      section("TUT102", "TUT", [{ day: 2, start: 690, end: 740, location: "MC" }]),
    ]
    const matched = matchSections(sections, parsed).map((s) => s.id)
    expect(matched).toContain("LEC001")
    expect(matched).toContain("TUT102")
    expect(matched).not.toContain("LEC002")
  })
})
