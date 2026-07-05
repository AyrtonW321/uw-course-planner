import type { DayIndex, Meeting, Section } from "./courses"

/**
 * Parse a pasted UW Quest "Class Schedule" into meeting blocks, then match
 * them against the live catalog sections (UW Flow-style import). The parser is
 * forgiving: it finds course headers ("MATH 237 - Calculus 3…") and any
 * "<days> <start> - <end>" time ranges beneath them.
 */

export type ParsedMeeting = { code: string; day: DayIndex; start: number; end: number }

const DAY_HEADER_RE = /\b([A-Z]{2,8})\s?(\d{3}[A-Z]?)\b\s*[-–]\s*\S/
// Two clock times with AM/PM, separated by a dash or "to".
const TIME_RE =
  /(\d{1,2}):(\d{2})\s?([AaPp])[Mm]\s*(?:[-–]|to)\s*(\d{1,2}):(\d{2})\s?([AaPp])[Mm]/g

function to24(h: number, m: number, ap: string): number {
  const p = ap.toUpperCase()
  if (p === "P" && h !== 12) h += 12
  if (p === "A" && h === 12) h = 0
  return h * 60 + m
}

/** Parse a day cluster like "MWF", "TTh", "Mo We Fr" into Mon–Fri indices. */
export function parseQuestDays(s: string): DayIndex[] {
  const days: DayIndex[] = []
  let i = 0
  while (i < s.length) {
    const two = s.slice(i, i + 2)
    if (two === "Th") {
      days.push(3)
      i += 2
    } else if (two === "Tu") {
      days.push(1)
      i += 2
    } else if (two === "Mo") {
      days.push(0)
      i += 2
    } else if (two === "We") {
      days.push(2)
      i += 2
    } else if (two === "Fr") {
      days.push(4)
      i += 2
    } else if (two === "Sa" || two === "Su") {
      i += 2 // weekend — ignored (calendar is Mon–Fri)
    } else {
      const c = s[i]
      if (c === "M") days.push(0)
      else if (c === "T") days.push(1)
      else if (c === "W") days.push(2)
      else if (c === "R") days.push(3)
      else if (c === "F") days.push(4)
      i += 1
    }
  }
  return [...new Set(days)]
}

export function parseQuestSchedule(text: string): ParsedMeeting[] {
  const out: ParsedMeeting[] = []
  const seen = new Set<string>()
  let currentCode = ""

  for (const line of text.split(/\r?\n/)) {
    const hm = line.match(DAY_HEADER_RE)
    if (hm) currentCode = `${hm[1].toUpperCase()} ${hm[2].toUpperCase()}`

    if (!currentCode) continue
    TIME_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = TIME_RE.exec(line))) {
      const start = to24(Number(m[1]), Number(m[2]), m[3])
      const end = to24(Number(m[4]), Number(m[5]), m[6])
      // Days sit in the short window just before the time range.
      const dayStr = line.slice(Math.max(0, m.index - 10), m.index)
      for (const day of parseQuestDays(dayStr)) {
        const key = `${currentCode}|${day}|${start}|${end}`
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ code: currentCode, day, start, end })
      }
    }
  }
  return out
}

export function meetingKey(m: { day: number; start: number; end: number }): string {
  return `${m.day}|${m.start}|${m.end}`
}

/**
 * Return the sections whose meeting times all appear in the parsed schedule —
 * i.e. the sections the student is actually enrolled in.
 */
export function matchSections(sections: Section[], parsed: ParsedMeeting[]): Section[] {
  const keys = new Set(parsed.map(meetingKey))
  return sections.filter(
    (s) => s.meetings.length > 0 && s.meetings.every((m: Meeting) => keys.has(meetingKey(m)))
  )
}
