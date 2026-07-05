import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import CourseSearch from "../../components/CourseSearch"
import { completedTerms } from "../../lib/degreePlan"
import { useDegreePlan } from "../../lib/degreePlan"
import { useProfileMeta } from "../../lib/profile"
import { isFailing, parseTranscript, useCompleted, type CompletedCourse } from "../../lib/completed"
import { glassCard, glassInput, goldButton, glassButton } from "../../lib/ui"

function GradeBadge({ grade }: { grade: number | null | undefined }) {
  if (grade === undefined)
    return <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300">No grade</span>
  if (grade === null)
    return <span className="rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-zinc-400">CR</span>
  return isFailing(grade) ? (
    <span className="rounded border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-300">Fail</span>
  ) : (
    <span className="rounded border border-green-500/40 bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-300">Pass</span>
  )
}

export default function CompletedPage() {
  const { plan } = useDegreePlan()
  const { meta } = useProfileMeta()
  const { completed, byCode, loading, add, remove, addMany } = useCompleted()

  const [raw, setRaw] = useState("")
  const [parsed, setParsed] = useState<CompletedCourse[] | null>(null)
  const [showImport, setShowImport] = useState(false)

  const done = useMemo(() => completedTerms(meta?.currentTerm), [meta?.currentTerm])
  const plannedInDone = useMemo(
    () => new Set(done.flatMap((t) => (plan[t] ?? []).map((c) => c.code))),
    [done, plan]
  )
  const others = useMemo(() => completed.filter((c) => !plannedInDone.has(c.code)), [completed, plannedInDone])

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-zinc-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-yellow-400" />
      </div>
    )
  }

  const setGrade = (code: string, name: string | undefined, value: string) => {
    const v = value.trim()
    if (v === "") {
      remove(code)
      return
    }
    const g = Math.max(0, Math.min(100, Math.round(Number(v))))
    if (Number.isNaN(g)) return
    add({ code, name, grade: g })
  }

  const gradeInput = (code: string, name: string | undefined) => {
    const entry = byCode.get(code)
    return (
      <input
        type="number"
        min={0}
        max={100}
        value={entry && entry.grade !== null ? entry.grade : ""}
        onChange={(e) => setGrade(code, name, e.target.value)}
        placeholder="—"
        className="w-16 rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 py-1 text-center text-sm text-white outline-none focus:border-yellow-500/60"
        title="Final grade (%)"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Grades &amp; Completed Courses</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Enter grades for terms you've finished. Below 50% is a fail and must be retaken.
          </p>
        </div>
        <button onClick={() => setShowImport((v) => !v)} className={`${glassButton} px-4 py-2 text-sm font-medium`}>
          {showImport ? "Close import" : "Import transcript"}
        </button>
      </div>

      {/* Transcript import */}
      {showImport && (
        <div className={`${glassCard} space-y-3 p-5`}>
          <p className="text-sm text-zinc-400">
            Paste your unofficial transcript (from Quest). We'll pull out course codes and grades.
          </p>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={5}
            placeholder="MATH 135  Algebra for Honours Mathematics  0.50  0.50  92 …"
            className={`${glassInput} font-mono`}
          />
          <div className="flex gap-2">
            <button onClick={() => setParsed(parseTranscript(raw))} disabled={!raw.trim()} className={`${glassButton} px-4 py-2 text-sm font-medium`}>
              Parse
            </button>
            {parsed && parsed.length > 0 && (
              <button
                onClick={() => {
                  addMany(parsed)
                  setParsed(null)
                  setRaw("")
                  setShowImport(false)
                }}
                className={`${goldButton} px-4 py-2 text-sm`}
              >
                Import {parsed.length} course{parsed.length === 1 ? "" : "s"}
              </button>
            )}
          </div>
          {parsed && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              {parsed.length === 0 ? (
                <p className="text-sm text-zinc-500">No courses detected.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {parsed.map((c) => (
                    <span key={c.code} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs">
                      <span className="font-mono font-bold text-yellow-400">{c.code}</span>
                      <span className="ml-1.5 text-zinc-400">{c.grade ?? "CR"}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Term-by-term grade entry */}
      {!meta?.currentTerm ? (
        <div className={`${glassCard} p-6 text-sm text-zinc-400`}>
          Set your current term in{" "}
          <Link to="/app/profile" className="text-yellow-400 hover:text-yellow-300">your profile</Link>{" "}
          so we know which terms you've completed.
        </div>
      ) : done.length === 0 ? (
        <div className={`${glassCard} p-6 text-sm text-zinc-500`}>
          You're in your first term — no completed terms yet.
        </div>
      ) : (
        <div className="space-y-4">
          {done.map((term) => {
            const courses = plan[term] ?? []
            return (
              <div key={term} className={`${glassCard} p-5`}>
                <h2 className="mb-3 font-mono text-sm font-bold text-white">{term}</h2>
                {courses.length === 0 ? (
                  <p className="text-xs text-zinc-600">No courses planned for this term.</p>
                ) : (
                  <ul className="divide-y divide-white/[0.05]">
                    {courses.map((c) => (
                      <li key={c.code} className="flex items-center gap-3 py-2.5">
                        <span className="font-mono text-sm font-bold text-yellow-400">{c.code}</span>
                        <span className="min-w-0 flex-1 truncate text-sm text-zinc-500">{c.name}</span>
                        <GradeBadge grade={byCode.has(c.code) ? byCode.get(c.code)!.grade : undefined} />
                        {gradeInput(c.code, c.name)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Courses not in your plan (e.g. transcript imports) */}
      <div className={`${glassCard} p-5`}>
        <h2 className="mb-1 text-sm font-semibold text-white">Other completed courses</h2>
        <p className="mb-3 text-xs text-zinc-500">Courses you've finished that aren't in a completed term of your plan.</p>
        <div className="mb-3">
          <CourseSearch placeholder="Add a completed course…" onPick={(c) => add({ code: c.code, name: c.name, grade: null })} />
        </div>
        {others.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing here.</p>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {others.map((c) => (
              <li key={c.code} className="flex items-center gap-3 py-2.5">
                <span className="font-mono text-sm font-bold text-yellow-400">{c.code}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-500">{c.name ?? ""}</span>
                <GradeBadge grade={c.grade} />
                {gradeInput(c.code, c.name)}
                <button onClick={() => remove(c.code)} className="flex-shrink-0 text-xs text-zinc-600 transition hover:text-red-400" aria-label={`Remove ${c.code}`}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
