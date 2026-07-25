import type { PrereqClause, ReqCourse } from "./requirements"

/**
 * Best-effort parser for UW's free-text `requirementsDescription`, e.g.:
 *   "Prereq: (One of MATH 106, 114, 115, 136, 146) and (MATH 128 with at least
 *    70% or MATH 138 with at least 60% or MATH 148); Honours Math students."
 *
 * Produces AND-clauses of OR-alternatives:
 *   [ [106, 114, 115, 136, 146], [128(≥70), 138(≥60), 148] ]
 * meaning the student needs one course from each clause. Grades are attached
 * to the alternatives that require them. Coreq/antireq tails are ignored.
 *
 * Heuristics: clauses are split on ";" and " and "; within a clause every
 * course code is treated as an OR alternative ("one of …", "X or Y").
 */

const CODE_RE = /([A-Z]{2,8})\s*(\d{3}[A-Z]?)|(\d{3}[A-Z]?)/g

function prereqSegment(text: string): string {
  const pi = text.toLowerCase().indexOf("prereq")
  if (pi < 0) return "" // no "Prereq:" label — don't scan unrelated prose (antireqs, descriptions) for course codes
  let seg = text.slice(pi)
  for (const kw of ["coreq", "antireq"]) {
    const i = seg.toLowerCase().indexOf(kw)
    if (i >= 0) seg = seg.slice(0, i)
  }
  return seg
}

/** Scan codes in order; a bare number inherits the previous subject. */
function scanCodes(s: string): string[] {
  const out: string[] = []
  let last = ""
  let m: RegExpExecArray | null
  CODE_RE.lastIndex = 0
  while ((m = CODE_RE.exec(s))) {
    if (m[1] && m[2]) {
      last = m[1].toUpperCase()
      out.push(`${last} ${m[2].toUpperCase()}`)
    } else if (m[3] && last) {
      out.push(`${last} ${m[3].toUpperCase()}`)
    }
  }
  return out
}

function gradeMap(seg: string): Map<string, number> {
  const grades = new Map<string, number>()
  // A single shared percentage inside a parenthesized group applies to all its
  // courses (e.g. "(MATH 106 or 114 or 115 with a grade of at least 70%)").
  // Groups with multiple percentages are left to the per-course patterns below.
  for (const g of seg.match(/\(([^)]*)\)/g) ?? []) {
    const pcts = [...g.matchAll(/(\d{2,3})\s*%/g)]
    if (pcts.length === 1) {
      const grade = Number(pcts[0][1])
      for (const code of scanCodes(g)) grades.set(code, grade)
    }
  }
  // "at least NN% in SUBJ ###"
  for (const m of seg.matchAll(/at least\s+(\d{2,3})\s*%\s+in\s+([A-Z]{2,8})\s*(\d{3}[A-Z]?)/gi)) {
    grades.set(`${m[2].toUpperCase()} ${m[3].toUpperCase()}`, Number(m[1]))
  }
  // "SUBJ ### with [a grade of] at least NN%"
  for (const m of seg.matchAll(/([A-Z]{2,8})\s*(\d{3}[A-Z]?)\s+with (?:a grade of )?at least\s+(\d{2,3})/gi)) {
    grades.set(`${m[1].toUpperCase()} ${m[2].toUpperCase()}`, Number(m[3]))
  }
  return grades
}

export function parsePrereqClauses(text: string | undefined | null): PrereqClause[] {
  if (!text) return []
  const seg = prereqSegment(text)
  if (!seg.trim()) return []

  const grades = gradeMap(seg)
  const clauses: PrereqClause[] = []

  for (const part of seg.split(/;|\band\b/i)) {
    const stripped = part.replace(/\d{2,3}\s*%/g, " ")
    const seen = new Set<string>()
    const clause: ReqCourse[] = []
    for (const code of scanCodes(stripped)) {
      if (seen.has(code)) continue
      seen.add(code)
      clause.push({ code, minGrade: grades.get(code) })
    }
    if (clause.length) clauses.push(clause)
  }
  return clauses
}
