import { useMemo, useState } from "react"
import { useProfileMeta } from "../lib/profile"
import { PLAN_YEARS, useDegreePlan, type PlannedCourse } from "../lib/degreePlan"
import { getCourseWithSections, getTermInfo } from "../lib/catalog"
import { glassCard, glassInput, goldButton } from "../lib/ui"

function AddCourseRow({ onAdd }: { onAdd: (c: PlannedCourse) => void }) {
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    const raw = code.trim().toUpperCase().replace(/\s+/, " ")
    if (!raw) return
    setBusy(true)
    let name = ""
    try {
      const term = await getTermInfo()
      const course = await getCourseWithSections(term.termCode, raw)
      if (course) name = course.name
    } catch {
      /* keep name blank if lookup fails */
    }
    onAdd({ code: raw, name })
    setCode("")
    setBusy(false)
  }

  return (
    <div className="mt-2 flex gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Add course (e.g. CS 136)"
        className={`${glassInput} py-1.5 text-xs`}
        disabled={busy}
      />
      <button
        onClick={submit}
        disabled={busy || !code.trim()}
        className={`${goldButton} flex-shrink-0 px-3 py-1.5 text-xs`}
      >
        {busy ? "…" : "Add"}
      </button>
    </div>
  )
}

export default function DegreePlannerPage() {
  const { meta } = useProfileMeta()
  const { plan, loading, addCourse, removeCourse, totalCourses } = useDegreePlan()

  const subtitle = useMemo(() => {
    const parts = [meta?.program, meta?.coop === "yes" ? "Co-op" : "Regular"].filter(Boolean)
    return parts.join(" · ")
  }, [meta])

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
          <h1 className="text-2xl font-bold tracking-tight text-white">Degree Planner</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {subtitle || "Map out every term of your degree"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{totalCourses}</p>
          <p className="text-xs text-zinc-500">courses planned</p>
        </div>
      </div>

      {meta?.gradTerm && meta?.gradYear && (
        <div className={`${glassCard} flex items-center justify-between p-4`}>
          <span className="text-sm text-zinc-400">Expected graduation</span>
          <span className="text-sm font-semibold text-yellow-400">
            {meta.gradTerm} {meta.gradYear}
          </span>
        </div>
      )}

      <div className="space-y-8">
        {PLAN_YEARS.map(({ year, terms }) => (
          <div key={year}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
              Year {year}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {terms.map((term) => {
                const courses = plan[term.id] ?? []
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
                        {courses.map((c) => (
                          <li key={c.code} className="flex items-center gap-2 py-2">
                            <span className="font-mono text-xs font-bold text-yellow-400">
                              {c.code}
                            </span>
                            <span className="truncate text-xs text-zinc-500">{c.name}</span>
                            <button
                              onClick={() => removeCourse(term.id, c.code)}
                              className="ml-auto flex-shrink-0 text-xs text-zinc-600 transition hover:text-red-400"
                              aria-label={`Remove ${c.code}`}
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <AddCourseRow onAdd={(c) => addCourse(term.id, c)} />
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
