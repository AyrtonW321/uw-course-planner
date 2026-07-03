import { useState } from "react"
import CourseSearch from "../../components/CourseSearch"
import { parseTranscript, useCompleted, type CompletedCourse } from "../../lib/completed"
import { glassCard, glassInput, goldButton, glassButton } from "../../lib/ui"

export default function CompletedPage() {
  const { completed, loading, add, remove, addMany } = useCompleted()
  const [raw, setRaw] = useState("")
  const [parsed, setParsed] = useState<CompletedCourse[] | null>(null)
  const [showImport, setShowImport] = useState(false)

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-zinc-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-yellow-400" />
      </div>
    )
  }

  const doParse = () => setParsed(parseTranscript(raw))
  const doImport = () => {
    if (parsed) addMany(parsed)
    setParsed(null)
    setRaw("")
    setShowImport(false)
  }

  const setGrade = (c: CompletedCourse, value: string) => {
    const g = value.trim() === "" ? null : Math.max(0, Math.min(100, Number(value)))
    add({ ...c, grade: Number.isNaN(g as number) ? null : g })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Completed Courses</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Courses you've finished. These verify prerequisites and count toward your audit.
          </p>
        </div>
        <button
          onClick={() => setShowImport((v) => !v)}
          className={`${glassButton} px-4 py-2 text-sm font-medium`}
        >
          {showImport ? "Close import" : "Import transcript"}
        </button>
      </div>

      {/* Transcript import */}
      {showImport && (
        <div className={`${glassCard} space-y-3 p-5`}>
          <p className="text-sm text-zinc-400">
            Paste your unofficial transcript (from Quest). We'll pull out course codes and grades —
            review before importing.
          </p>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={6}
            placeholder="MATH 135  Algebra for Honours Mathematics  0.50  0.50  92 …"
            className={`${glassInput} font-mono`}
          />
          <div className="flex gap-2">
            <button onClick={doParse} disabled={!raw.trim()} className={`${glassButton} px-4 py-2 text-sm font-medium`}>
              Parse
            </button>
            {parsed && parsed.length > 0 && (
              <button onClick={doImport} className={`${goldButton} px-4 py-2 text-sm`}>
                Import {parsed.length} course{parsed.length === 1 ? "" : "s"}
              </button>
            )}
          </div>

          {parsed && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              {parsed.length === 0 ? (
                <p className="text-sm text-zinc-500">No courses detected. Check the pasted text.</p>
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

      {/* Add one */}
      <div className={`${glassCard} p-5`}>
        <h2 className="mb-2 text-sm font-semibold text-white">Add a completed course</h2>
        <CourseSearch
          placeholder="Search a course you've completed…"
          onPick={(c) => add({ code: c.code, name: c.name, grade: null })}
        />
      </div>

      {/* List */}
      <div className={`${glassCard} p-5`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Your Completed Courses</h2>
          <span className="text-xs text-zinc-600">{completed.length} total</span>
        </div>

        {completed.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing added yet.</p>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {[...completed]
              .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
              .map((c) => (
                <li key={c.code} className="flex items-center gap-3 py-2.5">
                  <span className="font-mono text-sm font-bold text-yellow-400">{c.code}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-500">{c.name ?? ""}</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={c.grade ?? ""}
                    onChange={(e) => setGrade(c, e.target.value)}
                    placeholder="—"
                    className="w-16 rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 py-1 text-center text-sm text-white outline-none focus:border-yellow-500/60"
                    title="Final grade (%)"
                  />
                  <button
                    onClick={() => remove(c.code)}
                    className="flex-shrink-0 text-xs text-zinc-600 transition hover:text-red-400"
                    aria-label={`Remove ${c.code}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  )
}
