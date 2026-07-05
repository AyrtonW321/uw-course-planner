import type { Meeting, Section } from "./courses"
import type { TimetableEntry } from "./timetable"

/** Two meetings clash if they're on the same day and their times overlap. */
export function meetingsOverlap(a: Meeting, b: Meeting): boolean {
  return a.day === b.day && a.start < b.end && b.start < a.end
}

function meetingSetsOverlap(a: Meeting[], b: Meeting[]): boolean {
  for (const ma of a) for (const mb of b) if (meetingsOverlap(ma, mb)) return true
  return false
}

export function entriesConflict(a: TimetableEntry, b: TimetableEntry): boolean {
  return meetingSetsOverlap(a.meetings, b.meetings)
}

export type ConflictResult = {
  /** Section ids involved in at least one conflict. */
  sectionIds: Set<string>
  /** Human-readable conflicting pairs. */
  pairs: { a: TimetableEntry; b: TimetableEntry }[]
}

export function findConflicts(entries: TimetableEntry[]): ConflictResult {
  const sectionIds = new Set<string>()
  const pairs: { a: TimetableEntry; b: TimetableEntry }[] = []
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      if (entriesConflict(entries[i], entries[j])) {
        sectionIds.add(entries[i].sectionId)
        sectionIds.add(entries[j].sectionId)
        pairs.push({ a: entries[i], b: entries[j] })
      }
    }
  }
  return { sectionIds, pairs }
}

// --- Auto-suggest conflict-free combinations ---

export type CourseOptions = { code: string; title: string; sections: Section[] }
export type ChosenSection = { code: string; title: string; section: Section }

function sectionsConflict(a: Section, b: Section): boolean {
  return meetingSetsOverlap(a.meetings, b.meetings)
}

/**
 * Backtracking search for conflict-free schedules. Each course contributes one
 * "slot" per component type (LEC, TUT, LAB…); the search picks one section per
 * slot so that nothing overlaps. Returns up to `max` complete combinations.
 */
export function conflictFreeCombos(
  courses: CourseOptions[],
  max = 5
): ChosenSection[][] {
  // Build slots: one per (course, component type) that has options.
  const slots: ChosenSection[][] = []
  for (const c of courses) {
    const byType = new Map<string, Section[]>()
    for (const s of c.sections) {
      // Skip sections with no scheduled meetings (async/online) for conflict
      // purposes — they can't clash, so include them but they never overlap.
      const arr = byType.get(s.type) ?? []
      arr.push(s)
      byType.set(s.type, arr)
    }
    for (const [, list] of byType) {
      slots.push(list.slice(0, 12).map((section) => ({ code: c.code, title: c.title, section })))
    }
  }

  const results: ChosenSection[][] = []
  const chosen: ChosenSection[] = []

  const backtrack = (i: number) => {
    if (results.length >= max) return
    if (i === slots.length) {
      results.push([...chosen])
      return
    }
    for (const option of slots[i]) {
      const clashes = chosen.some((c) => sectionsConflict(c.section, option.section))
      if (clashes) continue
      chosen.push(option)
      backtrack(i + 1)
      chosen.pop()
      if (results.length >= max) return
    }
  }

  backtrack(0)
  return results
}
