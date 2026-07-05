import type { TimetableEntry } from "./timetable"

/**
 * Build an iCalendar (.ics) file from timetable entries.
 * Planned terms have no absolute dates, so each weekly class is emitted as a
 * recurring event starting on the next occurrence of its weekday, repeating
 * `weeks` times. Times are "floating" (local), which Google/Apple/Outlook
 * import as the viewer's local time. Importable into Google Calendar.
 */

const DAY_TO_JS = [1, 2, 3, 4, 5] // our Mon..Fri (0..4) → JS getDay Mon..Fri

function nextDateForDay(day: number, from = new Date()): Date {
  const target = DAY_TO_JS[day]
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const delta = (target - d.getDay() + 7) % 7
  d.setDate(d.getDate() + delta)
  return d
}

const pad = (n: number) => String(n).padStart(2, "0")

function fmt(date: Date, minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(h)}${pad(m)}00`
  )
}

function escapeText(s: string): string {
  return s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n")
}

export function buildICS(entries: TimetableEntry[], calName: string, weeks = 13): string {
  const now = new Date()
  const stamp = fmt(now, now.getHours() * 60 + now.getMinutes())
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UW Course Planner//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(calName)}`,
  ]

  let seq = 0
  for (const e of entries) {
    for (const m of e.meetings) {
      const date = nextDateForDay(m.day)
      const uid = `${e.sectionId}-${m.day}-${m.start}-${seq++}@uwcourseplanner`
      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${fmt(date, m.start)}`,
        `DTEND:${fmt(date, m.end)}`,
        `RRULE:FREQ=WEEKLY;COUNT=${weeks}`,
        `SUMMARY:${escapeText(`${e.code} ${e.type}`)}`,
        `LOCATION:${escapeText(m.location)}`,
        `DESCRIPTION:${escapeText(`${e.title}${e.instructor ? ` — ${e.instructor}` : ""}`)}`,
        "END:VEVENT"
      )
    }
  }

  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

export function downloadICS(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
