/**
 * Program requirements + prerequisite graph.
 * ------------------------------------------
 * Structured degree data isn't in the UW Open Data API (only free text), so it
 * lives here, entered per-program from the academic calendar. Fully populated
 * for Applied Math (SciComp & ML); add more programs to PROGRAMS over time.
 */

export type ReqCourse = {
  code: string
  name?: string
  credit?: number
  /** Minimum grade (%) required in this course as a prerequisite. */
  minGrade?: number
}

export type ReqGroup =
  | { kind: "all"; label?: string; courses: ReqCourse[] }
  | { kind: "oneOf"; label?: string; courses: ReqCourse[] }
  | { kind: "choose"; label: string } // free-text "Complete N additional…"

export type ProgramRequirements = {
  /** Must match the profile `program` value exactly. */
  program: string
  degree: string
  systemsOfStudy: string[]
  minAverages: string[]
  graduationRequirements: string[]
  mathUnits: number
  nonMathUnits: number
  totalUnits: number
  groups: ReqGroup[]
}

/** Shared Bachelor of Mathematics degree-level requirements. */
export const BMATH_DEGREE_LEVEL: string[] = [
  "Complete a minimum of 20.0 units.",
  "Minimum cumulative overall average of 60.0%.",
  "Complete the Faculty of Mathematics communication requirement (two courses).",
  "Satisfy the Bachelor of Mathematics breadth requirements.",
  "At least 50% of units used toward the degree must be completed at the University of Waterloo.",
  "Complete at least 9.0 of the required 20.0 units at the 300- or 400-level.",
]

const c = (code: string, name: string, minGrade?: number, credit = 0.5): ReqCourse => ({
  code,
  name,
  credit,
  minGrade,
})

export const PROGRAMS: Record<string, ProgramRequirements> = {
  "Applied Mathematics with Scientific Computing and Scientific Machine Learning": {
    program:
      "Applied Mathematics with Scientific Computing and Scientific Machine Learning",
    degree: "Bachelor of Mathematics - Honours",
    systemsOfStudy: ["Co-operative", "Regular"],
    minAverages: [
      "Minimum cumulative overall average of 60.0%.",
      "Minimum cumulative major average of 65.0% (all math courses).",
    ],
    graduationRequirements: [
      "Complete all required courses listed below.",
      "Complete a minimum of 13.0 units of math courses.",
      "Complete a minimum of 5.0 units of non-math courses.",
      "Satisfy the Bachelor of Mathematics degree-level requirements.",
    ],
    mathUnits: 13,
    nonMathUnits: 5,
    totalUnits: 20,
    groups: [
      {
        kind: "all",
        label: "Complete all of the following",
        courses: [
          c("AMATH 231", "Calculus 4"),
          c("AMATH 445", "Scientific Machine Learning"),
          c("CS 234", "Data Types and Structures"),
        ],
      },
      {
        kind: "oneOf",
        label: "Complete 1 of the following",
        courses: [
          c("AMATH 242", "Introduction to Computational Mathematics"),
          c("CS 371", "Introduction to Computational Mathematics"),
        ],
      },
      {
        kind: "oneOf",
        label: "Complete 1 of the following",
        courses: [
          c("AMATH 250", "Introduction to Differential Equations"),
          c("AMATH 251", "Introduction to Differential Equations (Advanced Level)"),
        ],
      },
      {
        kind: "oneOf",
        label: "Complete 1 of the following",
        courses: [
          c("AMATH 342", "Computational Methods for Differential Equations"),
          c("AMATH 345", "Data-Driven Mathematical Models"),
          c("AMATH 449", "Neural Networks"),
          c("CS 479", "Neural Networks"),
        ],
      },
      {
        kind: "oneOf",
        label: "Complete 1 of the following",
        courses: [
          c("CO 250", "Introduction to Optimization"),
          c("CO 255", "Introduction to Optimization (Advanced Level)"),
        ],
      },
      {
        kind: "oneOf",
        label: "Complete 1 of the following",
        courses: [
          c("MATH 237", "Calculus 3 for Honours Mathematics"),
          c("MATH 247", "Calculus 3 (Advanced Level)"),
        ],
      },
      { kind: "choose", label: "Complete 2 additional AMATH courses at the 300- or 400-level." },
      { kind: "choose", label: "Complete 1 additional AMATH course at the 400-level." },
      { kind: "choose", label: "Complete 4 additional courses from the options in List 1." },
    ],
  },
}

export function getProgramRequirements(
  program: string | undefined | null
): ProgramRequirements | undefined {
  if (!program) return undefined
  return PROGRAMS[program]
}

// --- Prerequisite graph -------------------------------------------------

/**
 * Structured prerequisites for the courses relevant to the supported program(s).
 * `minGrade` marks a prereq that needs a specific mark (shown yellow).
 */
export const PREREQS: Record<string, ReqCourse[]> = {
  "MATH 235": [c("MATH 136", "Linear Algebra 1")],
  "MATH 237": [c("MATH 137", "Calculus 2")],
  "MATH 247": [c("MATH 147", "Calculus 1 (Advanced)")],
  "CS 136": [c("CS 135", "Designing Functional Programs", 60)],
  "CS 234": [c("CS 136", "Elementary Algorithm Design")],
  "CS 371": [c("MATH 235", "Linear Algebra 2"), c("MATH 237", "Calculus 3")],
  "CO 250": [c("MATH 136", "Linear Algebra 1")],
  "STAT 230": [c("MATH 138", "Calculus 2")],
  "STAT 231": [c("STAT 230", "Probability", 60)],
  "AMATH 231": [c("MATH 237", "Calculus 3")],
  "AMATH 242": [c("CS 136", "Elementary Algorithm Design"), c("MATH 235", "Linear Algebra 2"), c("MATH 237", "Calculus 3")],
  "AMATH 250": [c("MATH 138", "Calculus 2")],
  "AMATH 251": [c("MATH 148", "Calculus 2 (Advanced)")],
  "AMATH 342": [c("AMATH 250", "Differential Equations")],
  "AMATH 345": [c("AMATH 250", "Differential Equations"), c("STAT 231", "Statistics")],
  "AMATH 445": [c("AMATH 242", "Computational Mathematics"), c("STAT 231", "Statistics")],
  "AMATH 449": [c("AMATH 350", "Differential Equations 2")],
  "CS 479": [c("CS 341", "Algorithms")],
  "CO 255": [c("MATH 136", "Linear Algebra 1", 80)],
}

export type PrereqStatus = "met" | "missing" | "grade"

/**
 * Status of `course`'s prerequisites given the set of courses the student
 * already has (completed/planned earlier).
 *  - "met": all prereqs satisfied
 *  - "grade": satisfied but one or more needs a minimum mark
 *  - "missing": at least one prereq not taken
 */
export function prereqStatus(
  courseCode: string,
  have: Set<string>
): { status: PrereqStatus; prereqs: ReqCourse[] } {
  const prereqs = PREREQS[courseCode] ?? []
  if (prereqs.length === 0) return { status: "met", prereqs }

  let anyMissing = false
  let anyGrade = false
  for (const p of prereqs) {
    if (!have.has(p.code)) anyMissing = true
    else if (p.minGrade) anyGrade = true
  }
  const status: PrereqStatus = anyMissing ? "missing" : anyGrade ? "grade" : "met"
  return { status, prereqs }
}

/** Reverse edges: which courses list `code` as a prerequisite. */
export function getLeadsTo(code: string): string[] {
  const out: string[] = []
  for (const [target, prereqs] of Object.entries(PREREQS)) {
    if (prereqs.some((p) => p.code === code)) out.push(target)
  }
  return out
}

/** Math-ish subjects, used to split math vs non-math units. */
const MATH_SUBJECTS = new Set([
  "MATH", "AMATH", "PMATH", "CO", "CS", "STAT", "ACTSC", "CM", "MATBUS", "MTHEL", "COMM",
])

export function isMathCourse(code: string): boolean {
  const subj = code.split(/\s+/)[0]
  return MATH_SUBJECTS.has(subj)
}

/** Best-effort credit value from a course code (labs are 0.25). */
export function estimateCredit(code: string): number {
  return /L$/.test(code.replace(/\s+/g, "")) ? 0.25 : 0.5
}
