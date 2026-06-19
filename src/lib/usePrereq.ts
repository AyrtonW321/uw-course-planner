import { useCallback, useEffect, useState } from "react"
import { getTermInfo, listAllCourses } from "./catalog"
import { PREREQS, getLeadsTo as handLeadsTo, type ReqCourse } from "./requirements"
import { parsePrereqs } from "./prereqParser"

type Index = {
  prereqs: Map<string, ReqCourse[]>
  leadsTo: Map<string, string[]>
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
        const prereqs = new Map<string, ReqCourse[]>()
        for (const c of courses) {
          const parsed = parsePrereqs(c.requirements)
          if (parsed.length) prereqs.set(c.code, parsed)
        }
        // Hand-curated entries win over parsed ones.
        for (const [code, list] of Object.entries(PREREQS)) prereqs.set(code, list)

        const leadsTo = new Map<string, string[]>()
        for (const [code, list] of prereqs.entries()) {
          for (const p of list) {
            const arr = leadsTo.get(p.code) ?? []
            if (!arr.includes(code)) arr.push(code)
            leadsTo.set(p.code, arr)
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
    (code: string): ReqCourse[] => index?.prereqs.get(code) ?? PREREQS[code] ?? [],
    [index]
  )
  const leadsTo = useCallback(
    (code: string): string[] => index?.leadsTo.get(code) ?? handLeadsTo(code),
    [index]
  )

  return { ready: !!index, resolve, leadsTo }
}
