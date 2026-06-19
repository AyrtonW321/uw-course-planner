/**
 * Mock course catalog.
 * ---------------------
 * Stand-in for the eventual Firestore `courses` collection / UW Open Data API.
 * Shapes are intentionally close to what real data will look like so the UI
 * can be swapped onto a live source later with minimal changes.
 */

/** Component code: LEC, TUT, LAB, SEM, TST, PRJ, … (open-ended in real data). */
export type SectionType = string

/** Day index: 0 = Monday … 4 = Friday. */
export type DayIndex = 0 | 1 | 2 | 3 | 4

export type Meeting = {
  day: DayIndex
  /** Minutes from midnight, e.g. 13 * 60 + 30 = 1:30pm. */
  start: number
  end: number
  location: string
}

export type Section = {
  id: string
  type: SectionType
  /** e.g. "001", "LEC 002", "TUT 102" */
  section: string
  instructor: string
  enrolled: number
  capacity: number
  meetings: Meeting[]
}

export type Course = {
  code: string
  name: string
  subject: string
  /** Units/credit isn't exposed by the UW course list, so it's optional. */
  credit?: number
  description: string
  /** Free-text prereq/coreq/antireq line from UW (`requirementsDescription`). */
  requirements?: string
  /** Structured prereqs (mock data only). */
  prereqs: string[]
  sections: Section[]
}

const t = (h: number, m: number) => h * 60 + m

export const COURSES: Course[] = [
  {
    code: "CS 136",
    name: "Elementary Algorithm Design and Data Abstraction",
    subject: "CS",
    credit: 0.5,
    description:
      "This course builds on the techniques and patterns learned in CS 135 while making the transition to use of an imperative language. Topics include the design, analysis, and implementation of algorithms and abstract data types.",
    prereqs: ["CS 135"],
    sections: [
      {
        id: "CS136-LEC001",
        type: "LEC",
        section: "LEC 001",
        instructor: "B. Lushman",
        enrolled: 188,
        capacity: 200,
        meetings: [
          { day: 1, start: t(13, 0), end: t(14, 20), location: "MC 4045" },
          { day: 3, start: t(13, 0), end: t(14, 20), location: "MC 4045" },
        ],
      },
      {
        id: "CS136-TUT102",
        type: "TUT",
        section: "TUT 102",
        instructor: "Staff",
        enrolled: 40,
        capacity: 45,
        meetings: [{ day: 2, start: t(11, 30), end: t(12, 20), location: "MC 2034" }],
      },
    ],
  },
  {
    code: "CS 136L",
    name: "Tools and Techniques for Software Development",
    subject: "CS",
    credit: 0.25,
    description:
      "An introduction to software development tools and techniques including version control, debugging, and testing in a lab setting.",
    prereqs: ["CS 135"],
    sections: [
      {
        id: "CS136L-LAB001",
        type: "LAB",
        section: "LAB 001",
        instructor: "Staff",
        enrolled: 28,
        capacity: 30,
        meetings: [{ day: 3, start: t(11, 30), end: t(12, 50), location: "MC 3003" }],
      },
    ],
  },
  {
    code: "MATH 237",
    name: "Calculus 3 for Honours Mathematics",
    subject: "MATH",
    credit: 0.5,
    description:
      "Calculus of functions of several variables. Limits, continuity, differentiability, the chain rule. The gradient vector and the directional derivative. Taylor's formula. Optimization problems. Multiple integration.",
    prereqs: ["MATH 138"],
    sections: [
      {
        id: "MATH237-LEC001",
        type: "LEC",
        section: "LEC 001",
        instructor: "S. New",
        enrolled: 150,
        capacity: 160,
        meetings: [
          { day: 0, start: t(12, 30), end: t(13, 20), location: "MC 4020" },
          { day: 2, start: t(12, 30), end: t(13, 20), location: "MC 4020" },
          { day: 4, start: t(12, 30), end: t(13, 20), location: "MC 4020" },
        ],
      },
      {
        id: "MATH237-TUT101",
        type: "TUT",
        section: "TUT 101",
        instructor: "Staff",
        enrolled: 38,
        capacity: 45,
        meetings: [{ day: 3, start: t(14, 30), end: t(15, 20), location: "MC 2017" }],
      },
    ],
  },
  {
    code: "STAT 230",
    name: "Probability",
    subject: "STAT",
    credit: 0.5,
    description:
      "This course provides an introduction to probability models including sample spaces, mutually exclusive and independent events, conditional probability and Bayes' Theorem. Discrete and continuous random variables, expectation and variance.",
    prereqs: ["MATH 138"],
    sections: [
      {
        id: "STAT230-LEC002",
        type: "LEC",
        section: "LEC 002",
        instructor: "C. Springer",
        enrolled: 175,
        capacity: 180,
        meetings: [
          { day: 0, start: t(15, 30), end: t(16, 20), location: "STC 0050" },
          { day: 2, start: t(15, 30), end: t(16, 20), location: "STC 0050" },
          { day: 4, start: t(15, 30), end: t(16, 20), location: "STC 0050" },
        ],
      },
      {
        id: "STAT230-TUT102",
        type: "TUT",
        section: "TUT 102",
        instructor: "Staff",
        enrolled: 42,
        capacity: 45,
        meetings: [{ day: 4, start: t(13, 30), end: t(14, 20), location: "MC 2035" }],
      },
    ],
  },
  {
    code: "CO 250",
    name: "Introduction to Optimization",
    subject: "CO",
    credit: 0.5,
    description:
      "A broad introduction to the field of optimization, discussing applications and solution techniques. Mathematical models for real-life problems; linear programming, integer programming, and nonlinear optimization.",
    prereqs: ["MATH 106", "MATH 136"],
    sections: [
      {
        id: "CO250-LEC002",
        type: "LEC",
        section: "LEC 002",
        instructor: "L. Sanità",
        enrolled: 120,
        capacity: 130,
        meetings: [
          { day: 1, start: t(10, 0), end: t(11, 20), location: "MC 4040" },
          { day: 3, start: t(10, 0), end: t(11, 20), location: "MC 4040" },
        ],
      },
    ],
  },
  {
    code: "AMATH 250",
    name: "Introduction to Differential Equations",
    subject: "AMATH",
    credit: 0.5,
    description:
      "Physical systems which lead to differential equations. Properties of solutions of differential equations through analytical, qualitative, and numerical techniques.",
    prereqs: ["MATH 128", "MATH 138"],
    sections: [
      {
        id: "AMATH250-LEC001",
        type: "LEC",
        section: "LEC 001",
        instructor: "D. Harmsworth",
        enrolled: 95,
        capacity: 110,
        meetings: [
          { day: 0, start: t(9, 30), end: t(10, 20), location: "MC 4060" },
          { day: 2, start: t(9, 30), end: t(10, 20), location: "MC 4060" },
          { day: 4, start: t(9, 30), end: t(10, 20), location: "MC 4060" },
        ],
      },
    ],
  },
  {
    code: "CS 245",
    name: "Logic and Computation",
    subject: "CS",
    credit: 0.5,
    description:
      "Propositional and predicate logic. Soundness and completeness and their implications. Formal logic and its relationship to computation, including undecidability and the limits of computation.",
    prereqs: ["CS 136", "MATH 135"],
    sections: [
      {
        id: "CS245-LEC001",
        type: "LEC",
        section: "LEC 001",
        instructor: "C. Roberts",
        enrolled: 160,
        capacity: 170,
        meetings: [
          { day: 1, start: t(14, 30), end: t(15, 50), location: "MC 2066" },
          { day: 3, start: t(14, 30), end: t(15, 50), location: "MC 2066" },
        ],
      },
    ],
  },
  {
    code: "ENGL 109",
    name: "Introduction to Academic Writing",
    subject: "ENGL",
    credit: 0.5,
    description:
      "This course introduces students to the fundamentals of academic writing, including argument, structure, style, and the writing process.",
    prereqs: [],
    sections: [
      {
        id: "ENGL109-LEC001",
        type: "LEC",
        section: "LEC 001",
        instructor: "J. Vincent",
        enrolled: 28,
        capacity: 30,
        meetings: [
          { day: 1, start: t(16, 0), end: t(17, 20), location: "HH 1101" },
          { day: 3, start: t(16, 0), end: t(17, 20), location: "HH 1101" },
        ],
      },
    ],
  },
]

const COURSE_BY_CODE = new Map(COURSES.map((c) => [c.code, c]))
const SECTION_INDEX = new Map<string, { course: Course; section: Section }>()
for (const course of COURSES) {
  for (const section of course.sections) {
    SECTION_INDEX.set(section.id, { course, section })
  }
}

export function getCourse(code: string): Course | undefined {
  return COURSE_BY_CODE.get(code)
}

export function getSection(id: string) {
  return SECTION_INDEX.get(id)
}

export function searchCourses(query: string): Course[] {
  const q = query.trim().toLowerCase()
  if (!q) return COURSES
  return COURSES.filter(
    (c) =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q)
  )
}

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const

export function formatTime(minutes: number): string {
  const h24 = Math.floor(minutes / 60)
  const m = minutes % 60
  const period = h24 >= 12 ? "pm" : "am"
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${m.toString().padStart(2, "0")}${period}`
}
