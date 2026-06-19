import CourseSearch from "../../components/CourseSearch"
import { COOP_SEQUENCES, getSequence, useCoopPlan } from "../../lib/coop"
import { glassCard, glassInput } from "../../lib/ui"

export default function CoopPage() {
  const { plan, loading, setSequence, setWork, addOnlineCourse, removeOnlineCourse } =
    useCoopPlan()

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-zinc-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-yellow-400" />
      </div>
    )
  }

  const seq = getSequence(plan.sequenceId)
  const workSlots = seq.slots.filter((s) => s.type === "work")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Co-op</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Track your work terms, employers, and any online courses you took.
        </p>
      </div>

      {/* Sequence selector */}
      <div className={`${glassCard} p-5`}>
        <h2 className="mb-3 text-sm font-semibold text-white">Co-op Sequence</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {COOP_SEQUENCES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSequence(s.id)}
              className={`rounded-lg border px-4 py-3 text-left transition ${
                s.id === plan.sequenceId
                  ? "border-yellow-500/60 bg-yellow-500/10"
                  : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              <p className={`text-sm font-semibold ${s.id === plan.sequenceId ? "text-yellow-400" : "text-white"}`}>
                {s.label}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">{s.description}</p>
            </button>
          ))}
        </div>

        {/* Sequence timeline */}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {seq.slots.map((slot) => (
            <span
              key={slot.id}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                slot.type === "study"
                  ? "border border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
                  : "border border-sky-500/30 bg-sky-500/10 text-sky-300"
              }`}
            >
              {slot.label}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-yellow-500/60" /> Study term
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-sky-500/60" /> Work term
          </span>
        </div>
      </div>

      {/* Work terms */}
      {workSlots.length === 0 ? (
        <div className={`${glassCard} p-6 text-sm text-zinc-500`}>
          This sequence has no work terms.
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-white">Work Terms</h2>
          {workSlots.map((slot) => {
            const record = plan.work[slot.id] ?? { status: "unemployed" as const }
            const online = plan.onlineCourses[slot.id] ?? []
            return (
              <div key={slot.id} className={`${glassCard} p-5`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-mono text-sm font-bold text-sky-300">{slot.label}</span>
                  <div className="flex gap-2">
                    {(["employed", "unemployed"] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setWork(slot.id, { ...record, status: st })}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition ${
                          record.status === st
                            ? "border-yellow-500/60 bg-yellow-500/10 text-yellow-400"
                            : "border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06]"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {record.status === "employed" && (
                  <input
                    value={record.employer ?? ""}
                    onChange={(e) => setWork(slot.id, { ...record, employer: e.target.value })}
                    placeholder="Employer (e.g. Shopify)"
                    className={`${glassInput} mt-3`}
                  />
                )}

                {/* Online courses during the work term */}
                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Online courses taken
                  </p>
                  {online.length > 0 && (
                    <ul className="mb-2 divide-y divide-white/[0.05]">
                      {online.map((crs) => (
                        <li key={crs.code} className="flex items-center gap-2 py-1.5">
                          <span className="font-mono text-xs font-bold text-yellow-400">{crs.code}</span>
                          <span className="truncate text-xs text-zinc-500">{crs.name}</span>
                          <button
                            onClick={() => removeOnlineCourse(slot.id, crs.code)}
                            className="ml-auto text-xs text-zinc-600 transition hover:text-red-400"
                            aria-label={`Remove ${crs.code}`}
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <CourseSearch
                    placeholder="Add an online course…"
                    onPick={(crs) => addOnlineCourse(slot.id, crs)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
