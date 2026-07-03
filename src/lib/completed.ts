import { useCallback, useMemo } from "react"
import { useUserDoc } from "./userDoc"

/** A course the student has already finished, with an optional final grade. */
export type CompletedCourse = {
  code: string
  name?: string
  grade: number | null
}

export function useCompleted() {
  const { data, loading, update } = useUserDoc()

  const completed = useMemo<CompletedCourse[]>(
    () => (Array.isArray(data?.completed) ? (data!.completed as CompletedCourse[]) : []),
    [data]
  )

  const codes = useMemo(() => new Set(completed.map((c) => c.code)), [completed])

  const grades = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of completed) if (typeof c.grade === "number") m.set(c.code, c.grade)
    return m
  }, [completed])

  const persist = useCallback(
    (next: CompletedCourse[]) => update({ completed: next }),
    [update]
  )

  // Add or update (same code overwrites).
  const add = useCallback(
    (course: CompletedCourse) => {
      const exists = completed.some((c) => c.code === course.code)
      persist(exists ? completed.map((c) => (c.code === course.code ? course : c)) : [...completed, course])
    },
    [completed, persist]
  )

  const remove = useCallback(
    (code: string) => persist(completed.filter((c) => c.code !== code)),
    [completed, persist]
  )

  const addMany = useCallback(
    (list: CompletedCourse[]) => {
      const map = new Map(completed.map((c) => [c.code, c]))
      for (const c of list) map.set(c.code, c)
      persist([...map.values()])
    },
    [completed, persist]
  )

  return { completed, codes, grades, loading, add, remove, addMany }
}

/**
 * Best-effort parser for a pasted UW unofficial transcript.
 * Extracts course codes and numeric grades line by line. Decimal unit values
 * (e.g. "0.50") are ignored so they aren't mistaken for grades; "CR" counts as
 * completed with no grade, "NCR"/"F"/"DNW"/"WD" are treated as not-completed.
 */
export function parseTranscript(text: string): CompletedCourse[] {
  const out = new Map<string, CompletedCourse>()
  const codeRe = /\b([A-Z]{2,8})\s?(\d{3}[A-Z]?)\b/
  // Integers that are not part of a decimal (so "0.50" units are skipped).
  const gradeRe = /(?<![.\d])(\d{1,3})(?![.\d])/g

  for (const line of text.split(/\r?\n/)) {
    const cm = line.match(codeRe)
    if (!cm) continue
    const code = `${cm[1].toUpperCase()} ${cm[2].toUpperCase()}`
    const rest = line.slice((cm.index ?? 0) + cm[0].length)

    if (/\bNCR\b|\bDNW\b|\bWD\b|\bF\b(?!\w)/i.test(rest)) continue // failed / withdrawn

    let grade: number | null = null
    const nums = rest.match(gradeRe)
    if (nums) {
      for (let i = nums.length - 1; i >= 0; i--) {
        const v = Number(nums[i])
        if (v >= 0 && v <= 100) {
          grade = v
          break
        }
      }
    }
    // Require either a numeric grade or an explicit CR to count as completed.
    if (grade === null && !/\bCR\b/i.test(rest)) continue
    out.set(code, { code, grade })
  }

  return [...out.values()]
}
