import { useCallback, useEffect, useState } from "react"
import { getTermInfo, listAllCourses } from "./catalog"
import { PREREQS, getLeadsTo as handLeadsTo, type PrereqClause } from "./requirements"
import { parsePrereqClauses } from "./prereqParser"

type Index = {
  prereqs: Map<string, PrereqClause[]>
  leadsTo: Map<string, string[]>
}

/** Hand-curated prereqs (flat) as single-alternative clauses, for fallback. */
function handClauses(code: string): PrereqClause[] {
  return (PREREQS[code] ?? []).map((rc) => [rc])
}

// Built once per term from the whole catalog, then reused across pages.
let cache: { term: string; index: Index } | null = null

/**
 * Resolves prerequisites and "leads to" edges for any course by parsing the
 * whole-term catalog's free-text requirements. Hand-curated PREREQS override
 * the parsed values. Falls back to the hand maps until the index is ready.
 */
export function usePrereqIndex() {
  const [index, setIndex] = useState<Index | null>(cache?.index ?? null)

  useEffect(() => {
    if (cache) {
      setIndex(cache.index)
      return
    }
    let alive = true
    getTermInfo()
      .then((t) => listAllCourses(t.termCode).then((courses) => ({ t, courses })))
      .then(({ t, courses }) => {
        const prereqs = new Map<string, PrereqClause[]>()
        for (const c of courses) {
          const parsed = parsePrereqClauses(c.requirements)
          if (parsed.length) prereqs.set(c.code, parsed)
        }

        // Reverse edges: a course leads to X if it appears in any alternative
        // of any of X's clauses.
        const leadsTo = new Map<string, string[]>()
        for (const [code, clauses] of prereqs.entries()) {
          const seen = new Set<string>()
          for (const clause of clauses) {
            for (const alt of clause) {
              if (seen.has(alt.code)) continue
              seen.add(alt.code)
              const arr = leadsTo.get(alt.code) ?? []
              if (!arr.includes(code)) arr.push(code)
              leadsTo.set(alt.code, arr)
            }
          }
        }

        const idx: Index = { prereqs, leadsTo }
        cache = { term: t.termCode, index: idx }
        if (alive) setIndex(idx)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const resolve = useCallback(
    (code: string): PrereqClause[] => index?.prereqs.get(code) ?? handClauses(code),
    [index]
  )
  const leadsTo = useCallback(
    (code: string): string[] => index?.leadsTo.get(code) ?? handLeadsTo(code),
    [index]
  )

  return { ready: !!index, resolve, leadsTo }
}
