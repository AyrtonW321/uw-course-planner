import type { ReqCourse } from "./requirements"

/**
 * Best-effort parser for UW's free-text `requirementsDescription`, e.g.:
 *   "Prereq: (MATH 106 or 114 or 115 with a grade of at least 70%) or
 *    (MATH 136 with a grade of at least 60%) or MATH 146; Honours Mathematics
 *    students. Coreq: MATH 128 or 138 or 148. Antireq: MATH 225, 245"
 *
 * Returns the prerequisite courses with any minimum-grade requirement attached.
 * Only the "Prereq" portion is used (coreq/antireq are stripped).
 */

const CODE_RE = /([A-Z]{2,8})\s*(\d{3}[A-Z]?)|(\d{3}[A-Z]?)/g

/** Isolate the prerequisite portion of the requirements text. */
function prereqSegment(text: string): string {
  let seg = text
  const lower = text.toLowerCase()
  const pi = lower.indexOf("prereq")
  if (pi >= 0) seg = text.slice(pi)
  // Drop coreq / antireq tails.
  for (const kw of ["coreq", "antireq"]) {
    const i = seg.toLowerCase().indexOf(kw)
    if (i >= 0) seg = seg.slice(0, i)
  }
  return seg
}

/** Scan codes in order, letting a bare number inherit the previous subject. */
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

export function parsePrereqs(text: string | undefined | null): ReqCourse[] {
  if (!text) return []
  const seg = prereqSegment(text)
  if (!seg.trim()) return []

  const grades = new Map<string, number>()

  // (A) "...with a grade of at least NN%" inside a parenthesized group applies
  //     to every course mentioned in that group.
  for (const g of seg.match(/\(([^)]*)\)/g) ?? []) {
    const pct = g.match(/(\d{2,3})\s*%/)
    if (pct) {
      const grade = Number(pct[1])
      for (const code of scanCodes(g)) grades.set(code, grade)
    }
  }

  // (B) "at least NN% in SUBJ ###"
  for (const m of seg.matchAll(/at least\s+(\d{2,3})\s*%\s+in\s+([A-Z]{2,8})\s*(\d{3}[A-Z]?)/gi)) {
    grades.set(`${m[2].toUpperCase()} ${m[3].toUpperCase()}`, Number(m[1]))
  }

  // (C) "SUBJ ### with a grade of at least NN%"
  for (const m of seg.matchAll(/([A-Z]{2,8})\s*(\d{3}[A-Z]?)\s+with a grade of at least\s+(\d{2,3})/gi)) {
    grades.set(`${m[1].toUpperCase()} ${m[2].toUpperCase()}`, Number(m[3]))
  }

  // Full course list — strip percentages first so grade numbers aren't read
  // as catalog numbers.
  const stripped = seg.replace(/\d{2,3}\s*%/g, " ")
  const seen = new Set<string>()
  const result: ReqCourse[] = []
  for (const code of scanCodes(stripped)) {
    if (seen.has(code)) continue
    seen.add(code)
    result.push({ code, minGrade: grades.get(code) })
  }
  return result
}
