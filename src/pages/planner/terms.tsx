import { useMemo } from "react"
import CourseSearch from "../../components/CourseSearch"
import { PLAN_YEARS, useDegreePlan } from "../../lib/degreePlan"
import { getLeadsTo, prereqStatus, type PrereqStatus } from "../../lib/requirements"
import { glassCard } from "../../lib/ui"

const STATUS_STYLE: Record<PrereqStatus, { dot: string; label: string }> = {
  met: { dot: "bg-green-400", label: "Prerequisites met" },
  grade: { dot: "bg-yellow-400", label: "Prereq needs a minimum grade" },
  missing: { dot: "bg-red-400", label: "Missing a prerequisite" },
}

// Order of terms, used to know what's "already taken" before a given term.
const TERM_ORDER = PLAN_YEARS.flatMap((y) => y.terms.map((t) => t.id))

export default function PlannerTerms() {
  const { plan, loading, addCourse, removeCourse, totalCourses } = useDegreePlan()

  // Cumulative set of course codes taken strictly before each term.
  const haveBeforeTerm = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    const acc = new Set<string>()
    for (const termId of TERM_ORDER) {
      map[termId] = new Set(acc)
      for (const crs of plan[termId] ?? []) acc.add(crs.code)
    }
    return map
  }, [plan])

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-zinc-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-yellow-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Planner</h1>
          <p className="mt-1 text-sm text-zinc-500">{totalCourses} courses planned</p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-400" /> Met</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-yellow-400" /> Needs grade</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Missing</span>
        </div>
      </div>

      <div className="space-y-8">
        {PLAN_YEARS.map(({ year, terms }) => (
          <div key={year}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
              Year {year}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {terms.map((term) => {
                const courses = plan[term.id] ?? []
                const have = haveBeforeTerm[term.id] ?? new Set<string>()
                return (
                  <div key={term.id} className={`${glassCard} p-5`}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-white">{term.label}</span>
                      <span className="text-xs text-zinc-600">
                        {courses.length} course{courses.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {courses.length === 0 ? (
                      <p className="py-2 text-xs text-zinc-600">No courses yet.</p>
                    ) : (
                      <ul className="divide-y divide-white/[0.05]">
                        {courses.map((crs) => {
                          const { status, prereqs } = prereqStatus(crs.code, have)
                          const leadsTo = getLeadsTo(crs.code)
                          const style = STATUS_STYLE[status]
                          const tip = [
                            style.label,
                            prereqs.length
                              ? `Prereqs: ${prereqs
                                  .map((p) => p.code + (p.minGrade ? ` (≥${p.minGrade}%)` : ""))
                                  .join(", ")}`
                              : "No prerequisites",
                            leadsTo.length ? `Leads to: ${leadsTo.join(", ")}` : "",
                          ]
                            .filter(Boolean)
                            .join("\n")
                          return (
                            <li key={crs.code} className="flex items-center gap-2 py-2">
                              <span
                                className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${style.dot}`}
                                title={tip}
                              />
                              <span className="font-mono text-xs font-bold text-yellow-400">
                                {crs.code}
                              </span>
                              <span className="truncate text-xs text-zinc-500">{crs.name}</span>
                              {leadsTo.length > 0 && (
                                <span
                                  className="ml-auto flex-shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-1.5 text-[10px] text-zinc-400"
                                  title={`Leads to: ${leadsTo.join(", ")}`}
                                >
                                  →{leadsTo.length}
                                </span>
                              )}
                              <button
                                onClick={() => removeCourse(term.id, crs.code)}
                                className="flex-shrink-0 text-xs text-zinc-600 transition hover:text-red-400"
                                aria-label={`Remove ${crs.code}`}
                              >
                                ✕
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}

                    <div className="mt-2">
                      <CourseSearch
                        placeholder="Search to add a course…"
                        onPick={(c) => addCourse(term.id, c)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
