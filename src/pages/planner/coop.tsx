import { useState } from "react"
import CourseSearch from "../../components/CourseSearch"
import { COOP_SEQUENCES, useCoopPlan } from "../../lib/coop"
import { cardSurface, inputSurface, subtleButton } from "../../lib/ui"

export default function CoopPage() {
  const {
    plan,
    slots,
    loading,
    setSequence,
    reorderSlots,
    addWorkTerm,
    removeSlot,
    setWork,
    addOnlineCourse,
    removeOnlineCourse,
  } = useCoopPlan()

  const [dragIndex, setDragIndex] = useState<number | null>(null)

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-zinc-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-yellow-400" />
      </div>
    )
  }

  const workSlots = slots.filter((s) => s.type === "work")

  const slotStyle = (type: string) =>
    type === "study"
      ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
      : type === "work"
      ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
      : "border-white/[0.1] bg-white/[0.04] text-zinc-400"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Co-op</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pick a Math sequence or build your own, and track each work term.
        </p>
      </div>

      {/* Sequence selector */}
      <div className={`${cardSurface} p-5`}>
        <h2 className="mb-3 text-sm font-semibold text-white">Co-op Sequence</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {COOP_SEQUENCES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSequence(s.id)}
              className={`rounded-lg border px-4 py-3 text-left transition ${
                s.id === plan.sequenceId && !plan.slots
                  ? "border-yellow-500/60 bg-yellow-500/10"
                  : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              <p className="text-sm font-semibold text-white">{s.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{s.description}</p>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-600">
          Picking a sequence resets your custom layout below.
        </p>
      </div>

      {/* Manual schedule editor (drag to reorder) */}
      <div className={`${cardSurface} p-5`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Your Schedule</h2>
          <button onClick={addWorkTerm} className={`${subtleButton} px-3 py-1.5 text-xs font-medium`}>
            + Add work term
          </button>
        </div>
        <p className="mb-3 text-xs text-zinc-600">Drag terms to reorder your sequence, or use the arrows.</p>

        <div className="flex flex-wrap gap-2">
          {slots.map((slot, i) => (
            <div
              key={slot.id}
              draggable
              onDragStart={(e) => {
                setDragIndex(i)
                e.dataTransfer.effectAllowed = "move"
                e.dataTransfer.setData("text/plain", String(i))
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = "move"
              }}
              onDrop={(e) => {
                e.preventDefault()
                if (dragIndex !== null) reorderSlots(dragIndex, i)
                setDragIndex(null)
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`group flex cursor-grab items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium active:cursor-grabbing ${slotStyle(
                slot.type
              )} ${dragIndex === i ? "opacity-50" : ""}`}
            >
              <span>{slot.label}</span>
              <button
                onClick={() => reorderSlots(i, i - 1)}
                disabled={i === 0}
                className="text-zinc-500 transition hover:text-white disabled:opacity-20 disabled:hover:text-zinc-500"
                aria-label={`Move ${slot.label} earlier`}
              >
                ◀
              </button>
              <button
                onClick={() => reorderSlots(i, i + 1)}
                disabled={i === slots.length - 1}
                className="text-zinc-500 transition hover:text-white disabled:opacity-20 disabled:hover:text-zinc-500"
                aria-label={`Move ${slot.label} later`}
              >
                ▶
              </button>
              <button
                onClick={() => removeSlot(slot.id)}
                className="text-zinc-500 opacity-0 transition hover:text-red-400 focus:opacity-100 group-hover:opacity-100"
                aria-label={`Remove ${slot.label}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-yellow-500/60" /> Study</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-sky-500/60" /> Work</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-zinc-500/60" /> Off</span>
        </div>
      </div>

      {/* Work terms */}
      {workSlots.length === 0 ? (
        <div className={`${cardSurface} p-6 text-sm text-zinc-500`}>
          This schedule has no work terms. Use “Add work term” above.
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-white">Work Terms</h2>
          {workSlots.map((slot) => {
            const record = plan.work[slot.id] ?? { status: "unemployed" as const }
            const online = plan.onlineCourses[slot.id] ?? []
            return (
              <div key={slot.id} className={`${cardSurface} p-5`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-mono text-sm font-bold text-sky-300">{slot.label}</span>
                  <div className="flex gap-2">
                    {(["employed", "unemployed"] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setWork(slot.id, { ...record, status: st })}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
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
                    aria-label="Employer"
                    value={record.employer ?? ""}
                    onChange={(e) => setWork(slot.id, { ...record, employer: e.target.value })}
                    placeholder="Employer (e.g. Shopify)"
                    className={`${inputSurface} mt-3`}
                  />
                )}

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
