/**
 * University of Waterloo Open Data API (v3) client.
 * -------------------------------------------------
 * Docs / key registration: https://openapi.data.uwaterloo.ca/
 * Auth: send the key in the `X-API-KEY` header. The API returns
 * `Access-Control-Allow-Origin: *`, so direct browser calls work.
 *
 * The key lives in `VITE_UWATERLOO_API_KEY`. Like the Firebase config, a
 * VITE_-prefixed var is bundled into the client, so this key is public — it's a
 * free, rate-limited, read-only key, which is acceptable here. To fully hide it
 * later, move these calls behind a serverless proxy and drop the VITE_ prefix.
 */

const BASE = "https://openapi.data.uwaterloo.ca/v3"

const API_KEY = import.meta.env.VITE_UWATERLOO_API_KEY as string | undefined

/** True when a key is configured, so callers can fall back to mock data. */
export function hasUwApi(): boolean {
  return Boolean(API_KEY)
}

export class UwApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = "UwApiError"
    this.status = status
  }
}

async function request<T>(path: string): Promise<T> {
  if (!API_KEY) {
    throw new UwApiError(
      "Missing VITE_UWATERLOO_API_KEY. Add your UW Open Data key to .env."
    )
  }

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "X-API-KEY": API_KEY,
      Accept: "application/json",
    },
  })

  if (!res.ok) {
    let detail = ""
    try {
      const body = await res.json()
      detail = body?.Message ?? ""
    } catch {
      /* ignore */
    }
    throw new UwApiError(
      `UW API ${res.status} on ${path}${detail ? `: ${detail}` : ""}`,
      res.status
    )
  }

  return res.json() as Promise<T>
}

// --- Raw v3 response shapes (only the fields we use) ---

export interface UwTerm {
  termCode: string
  name: string
  nameShort?: string
  associatedAcademicYear?: number
  termBeginDate?: string
  termEndDate?: string
  sortDate?: string
}

export interface UwSubject {
  code: string
  name?: string
  descriptionAbbreviated?: string
  description?: string
  associatedAcademicGroupCode?: string
}

export interface UwCourse {
  courseId: string
  courseOfferNumber: number
  termCode: string
  termName?: string
  subjectCode: string
  catalogNumber: string
  title: string
  descriptionAbbreviated?: string
  description?: string
  requirementsDescription?: string | null
  gradingBasis?: string
  courseComponentCode?: string
}

export interface UwScheduleMeeting {
  scheduleStartDate?: string
  scheduleEndDate?: string
  classMeetingStartTime?: string
  classMeetingEndTime?: string
  classMeetingDayPatternCode?: string
  classMeetingWeekPatternCode?: string
  locationName?: string
}

export interface UwScheduleInstructor {
  instructorRole?: string
  instructorFirstName?: string
  instructorLastName?: string
}

export interface UwClassSchedule {
  courseId: string
  courseOfferNumber: number
  termCode: string
  classSection?: string
  classNumber: number
  courseComponent?: string
  maxEnrollmentCapacity?: number
  enrolledStudents?: number
  scheduleData?: UwScheduleMeeting[]
  instructorData?: UwScheduleInstructor[]
}

// --- Endpoints ---

export function getTerms() {
  return request<UwTerm[]>("/Terms")
}

export function getCurrentTerm() {
  return request<UwTerm>("/Terms/current")
}

export function getSubjects() {
  return request<UwSubject[]>("/Subjects")
}

/** All courses offered in a term (large payload — cache it). */
export function getCoursesByTerm(termCode: string) {
  return request<UwCourse[]>(`/Courses/${termCode}`)
}

export function getCoursesBySubject(termCode: string, subject: string) {
  return request<UwCourse[]>(`/Courses/${termCode}/${subject}`)
}

/** Sections + meeting times for one course in a term. */
export function getClassSchedules(
  termCode: string,
  subject: string,
  catalogNumber: string
) {
  return request<UwClassSchedule[]>(
    `/ClassSchedules/${termCode}/${subject}/${catalogNumber}`
  )
}
