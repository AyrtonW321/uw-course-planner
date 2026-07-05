import { describe, expect, it } from "vitest"
import { buildICS } from "./ics"
import type { TimetableEntry } from "./timetable"

const entry: TimetableEntry = {
  sectionId: "3715",
  code: "CS 136",
  title: "Elementary Algorithm Design",
  type: "LEC",
  section: "001",
  termCode: "1265",
  instructor: "B. Lushman",
  meetings: [
    { day: 1, start: 13 * 60, end: 14 * 60 + 20, location: "MC 4045" },
    { day: 3, start: 13 * 60, end: 14 * 60 + 20, location: "MC 4045" },
  ],
}

describe("buildICS", () => {
  const ics = buildICS([entry], "UW 1A")

  it("wraps a valid calendar", () => {
    expect(ics).toContain("BEGIN:VCALENDAR")
    expect(ics).toContain("END:VCALENDAR")
    expect(ics).toContain("X-WR-CALNAME:UW 1A")
  })

  it("emits one VEVENT per meeting with a weekly rule", () => {
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2)
    expect(ics).toContain("RRULE:FREQ=WEEKLY;COUNT=13")
    expect(ics).toContain("SUMMARY:CS 136 LEC")
    expect(ics).toContain("LOCATION:MC 4045")
  })
})
