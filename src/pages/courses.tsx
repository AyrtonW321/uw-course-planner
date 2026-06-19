import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { searchCourses } from "../lib/courses"
import { useTimetable } from "../lib/timetable"
import { glassCard, glassInput } from "../lib/ui"

export default function CoursesPage() {
  const [params, setParams] = useSearchParams()
  const initialQ = params.get("q") ?? ""
  const [query, setQuery] = useState(initialQ)
  const { sectionIds } = useTimetable()

  const results = useMemo(() => searchCourses(query), [query])

  const addedCodes = useMemo(() => {
    const set = new Set<string>()
    for (const c of results) {
      if (c.sections.some((s) => sectionIds.includes(s.id))) set.add(c.code)
    }
    return set
  }, [results, sectionIds])

  const onSearch = (value: string) => {
    setQuery(value)
    if (value) setParams({ q: value }, { replace: true })
    else setParams({}, { replace: true })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Courses</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Browse the catalog and add sections to your timetable.
        </p>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search by code, name, or subject (e.g. CS 136, Probability)"
        className={glassInput}
        autoFocus
      />

      <p className="text-xs text-zinc-600">
        {results.length} course{results.length === 1 ? "" : "s"}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {results.map((c) => (
          <Link
            key={c.code}
            to={`/app/courses/${encodeURIComponent(c.code)}`}
            className={`${glassCard} group block p-5 transition hover:border-yellow-500/30 hover:bg-white/[0.06]`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-yellow-400">
                    {c.code}
                  </span>
                  <span className="text-xs text-zinc-600">{c.credit} credit</span>
                </div>
                <p className="mt-1 truncate text-sm font-medium text-white">{c.name}</p>
              </div>
              {addedCodes.has(c.code) && (
                <span className="flex-shrink-0 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-400">
                  Added
                </span>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">
              {c.description}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-zinc-600">
              <span>{c.sections.length} section{c.sections.length === 1 ? "" : "s"}</span>
              {c.prereqs.length > 0 && <span>Prereq: {c.prereqs.join(", ")}</span>}
              <span className="ml-auto text-yellow-400/70 transition group-hover:text-yellow-400">
                View →
              </span>
            </div>
          </Link>
        ))}

        {results.length === 0 && (
          <div className={`${glassCard} p-8 text-center text-sm text-zinc-500 sm:col-span-2`}>
            No courses match “{query}”.
          </div>
        )}
      </div>
    </div>
  )
}
