/**
 * Catalog abstraction.
 * --------------------
 * One API for the UI to read courses, whether the data comes from the live UW
 * Open Data API (when a key is set) or the bundled mock catalog (fallback).
 * All functions return the shared domain types from `courses.ts`.
 */

import {
  COURSES,
  getCourse as getMockCourse,
  type Course,
  type DayIndex,
  type Section,
} from "./courses"
import {
  getClassSchedules,
  getCoursesByTerm,
  getCoursesBySubject,
  getCurrentTerm,
  getSubjects,
  hasUwApi,
  type UwClassSchedule,
  type UwCourse,
} from "./uwapi"
import { cacheGet, cacheSet, DAY, WEEK } from "./cache"

export const USE_API = hasUwApi()

// --- Mapping helpers ---

// UW day-pattern letters → our Mon–Fri index. R = Thursday. Weekends ignored
// since the calendar only renders the work week.
const DAY_MAP: Record<string, DayIndex> = { M: 0, T: 1, W: 2, R: 3, F: 4 }

function parseDays(pattern?: string): DayIndex[] {
  if (!pattern) return []
  const days: DayIndex[] = []
  for (const ch of pattern) {
    if (ch in DAY_MAP) days.push(DAY_MAP[ch])
  }
  return days
}

/** "2026-06-19T13:00:00" → 780 (minutes since midnight). */
function parseTime(iso?: string): number | null {
  if (!iso) return null
  const timePart = iso.includes("T") ? iso.split("T")[1] : iso
  const [h, m] = timePart.split(":").map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

function instructorName(cs: UwClassSchedule): string {
  const i = cs.instructorData?.[0]
  if (!i) return "Staff"
  return [i.instructorFirstName, i.instructorLastName].filter(Boolean).join(" ") || "Staff"
}

function mapSchedule(schedules: UwClassSchedule[]): Section[] {
  return schedules.map((cs) => {
    const meetings = (cs.scheduleData ?? []).flatMap((m) => {
      const start = parseTime(m.classMeetingStartTime)
      const end = parseTime(m.classMeetingEndTime)
      if (start == null || end == null) return []
      return parseDays(m.classMeetingDayPatternCode).map((day) => ({
        day,
        start,
        end,
        location: m.locationName ?? "TBA",
      }))
    })

    return {
      id: String(cs.classNumber),
      type: cs.courseComponent ?? "LEC",
      section: String(cs.classSection ?? "").padStart(3, "0"),
      instructor: instructorName(cs),
      enrolled: cs.enrolledStudents ?? 0,
      capacity: cs.maxEnrollmentCapacity ?? 0,
      meetings,
    }
  })
}

function mapCourse(c: UwCourse, sections: Section[] = []): Course {
  return {
    code: `${c.subjectCode} ${c.catalogNumber}`,
    name: c.title,
    subject: c.subjectCode,
    description: c.description ?? c.descriptionAbbreviated ?? "",
    requirements: c.requirementsDescription ?? undefined,
    prereqs: [],
    sections,
  }
}

// --- Term ---

let termCache: { termCode: string; name: string } | null = null

export async function getTermInfo(): Promise<{ termCode: string; name: string }> {
  if (termCache) return termCache
  if (!USE_API) {
    termCache = { termCode: "MOCK", name: "Sample term" }
    return termCache
  }
  const cached = cacheGet<{ termCode: string; name: string }>("term:current", DAY)
  if (cached) {
    termCache = cached
    return cached
  }
  const t = await getCurrentTerm()
  termCache = { termCode: t.termCode, name: t.name }
  cacheSet("term:current", termCache)
  return termCache
}

// --- Subjects ---

let subjectsCache: { code: string; name: string }[] | null = null

export async function listSubjects(): Promise<{ code: string; name: string }[]> {
  if (subjectsCache) return subjectsCache
  if (!USE_API) {
    const set = new Map<string, string>()
    for (const c of COURSES) set.set(c.subject, c.subject)
    subjectsCache = [...set.values()].sort().map((code) => ({ code, name: code }))
    return subjectsCache
  }
  const cached = cacheGet<{ code: string; name: string }[]>("subjects", WEEK)
  if (cached) {
    subjectsCache = cached
    return cached
  }
  const subs = await getSubjects()
  subjectsCache = subs
    .map((s) => ({ code: s.code, name: s.description || s.name || s.code }))
    .sort((a, b) => a.code.localeCompare(b.code))
  cacheSet("subjects", subjectsCache)
  return subjectsCache
}

// --- Courses ---

// Cache the per-subject course list so the detail page can reuse it for meta.
const subjectCoursesCache = new Map<string, Course[]>()

export async function listCoursesBySubject(
  termCode: string,
  subject: string
): Promise<Course[]> {
  const key = `${termCode}:${subject}`
  const cached = subjectCoursesCache.get(key)
  if (cached) return cached

  let courses: Course[]
  if (!USE_API) {
    courses = COURSES.filter((c) => c.subject === subject)
  } else {
    const persisted = cacheGet<Course[]>(`subj:${key}`, DAY)
    if (persisted) {
      subjectCoursesCache.set(key, persisted)
      return persisted
    }
    const raw = await getCoursesBySubject(termCode, subject)
    courses = raw
      .map((c) => mapCourse(c))
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
    cacheSet(`subj:${key}`, courses)
  }
  subjectCoursesCache.set(key, courses)
  return courses
}

// Whole-term catalog, cached, for course-wide autocomplete + prereq parsing.
let allCoursesCache: { termCode: string; courses: Course[] } | null = null

// Slim shape persisted to localStorage (the whole term is large; drop the big
// `description` field, which the search + prereq index don't need).
type SlimCourse = { code: string; name: string; subject: string; requirements?: string }
const toSlim = (c: Course): SlimCourse => ({
  code: c.code,
  name: c.name,
  subject: c.subject,
  requirements: c.requirements,
})
const fromSlim = (s: SlimCourse): Course => ({
  code: s.code,
  name: s.name,
  subject: s.subject,
  description: "",
  requirements: s.requirements,
  prereqs: [],
  sections: [],
})

export async function listAllCourses(termCode: string): Promise<Course[]> {
  if (allCoursesCache?.termCode === termCode) return allCoursesCache.courses

  let courses: Course[]
  if (!USE_API) {
    courses = COURSES
  } else {
    const persisted = cacheGet<SlimCourse[]>(`all:${termCode}`, DAY)
    if (persisted) {
      courses = persisted.map(fromSlim)
      allCoursesCache = { termCode, courses }
      return courses
    }
    const raw = await getCoursesByTerm(termCode)
    courses = raw
      .map((c) => mapCourse(c))
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
    cacheSet(`all:${termCode}`, courses.map(toSlim))
  }
  allCoursesCache = { termCode, courses }
  return courses
}

export async function getCourseWithSections(
  termCode: string,
  code: string
): Promise<Course | undefined> {
  if (!USE_API) return getMockCourse(code)

  const [subject, catalog] = code.split(/\s+/)
  if (!subject || !catalog) return undefined

  // Course meta (description, requirements) comes from the subject list.
  const list = await listCoursesBySubject(termCode, subject)
  const meta = list.find((c) => c.code === code)

  let sections: Section[] = []
  try {
    const schedules = await getClassSchedules(termCode, subject, catalog)
    sections = mapSchedule(schedules)
  } catch {
    // No schedule yet (e.g. future term) — show the course without sections.
  }

  if (!meta) return undefined
  return { ...meta, sections }
}
