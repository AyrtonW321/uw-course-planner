import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import CourseSearch from "../../components/CourseSearch"
import { useDegreePlan } from "../../lib/degreePlan"
import { useCoopPlan, type CoopSlot } from "../../lib/coop"
import { useProfileMeta } from "../../lib/profile"
import {
  getLeadsTo,
  getProgramRequirements,
  prereqStatus,
  type PrereqStatus,
} from "../../lib/requirements"
import { glassCard } from "../../lib/ui"
import RequirementsAside from "./RequirementsAside"

const STATUS_DOT: Record<PrereqStatus, string> = {
  met: "bg-green-400",
  grade: "bg-yellow-400",
  missing: "bg-red-400",
}

type DragState = { from: string; code: string } | null

export default function PlannerTerms() {
  const navigate = useNavigate()
  const { plan, loading, addCourse, removeCourse, moveCourse } = useDegreePlan()
  const { meta } = useProfileMeta()
  const coop = useCoopPlan()
  const slots = coop.slots
  const [drag, setDrag] = useState<DragState>(null)

  // Cumulative course codes taken before each slot, in sequence order.
  const haveBeforeSlot = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    const acc = new Set<string>()
    for (const slot of slots) {
      map[slot.id] = new Set(acc)
      if (slot.type === "study") for (const c of plan[slot.label] ?? []) acc.add(c.code)
      if (slot.type === "work") for (const c of coop.plan.onlineCourses[slot.id] ?? []) acc.add(c.code)
    }
    return map
  }, [slots, plan, coop.plan.onlineCourses])

  if (loading || coop.loading) {
    return (
      <div className="flex justify-center py-20 text-zinc-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-yellow-400" />
      </div>
    )
  }

  const open = (code: string) => navigate(`/app/courses/${encodeURIComponent(code)}`)

  // --- Render helpers (plain functions, NOT components, so the DOM identity is
  // stable across re-renders and native drag-and-drop isn't interrupted). ---

  const renderStudy = (slot: CoopSlot) => {
    const courses = plan[slot.label] ?? []
    const have = haveBeforeSlot[slot.id] ?? new Set<string>()
    const isDropTarget = drag && drag.from !== slot.label

    return (
      <div
        key={slot.id}
        onDragOver={(e) => {
          if (isDropTarget) {
            e.preventDefault()
            e.dataTransfer.dropEffect = "move"
          }
        }}
        onDrop={(e) => {
          e.preventDefault()
          if (drag) moveCourse(drag.from, slot.label, drag.code)
          setDrag(null)
        }}
        className={`${glassCard} p-5 transition ${
          isDropTarget ? "border-yellow-500/40 ring-1 ring-yellow-500/30" : ""
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-sm font-bold text-white">{slot.label}</span>
          <span className="text-xs text-zinc-600">
            {courses.length} course{courses.length === 1 ? "" : "s"}
          </span>
        </div>

        {courses.length === 0 ? (
          <p className="py-2 text-xs text-zinc-600">Drag or search to add courses.</p>
        ) : (
          <ul className="space-y-1">
            {courses.map((crs) => {
              const { status, prereqs } = prereqStatus(crs.code, have)
              const leadsTo = getLeadsTo(crs.code)
              const tip = [
                status === "met" ? "Prerequisites met" : status === "grade" ? "Prereq needs a grade" : "Missing a prerequisite",
                prereqs.length ? `Prereqs: ${prereqs.map((p) => p.code + (p.minGrade ? ` (≥${p.minGrade}%)` : "")).join(", ")}` : "No prerequisites",
                leadsTo.length ? `Leads to: ${leadsTo.join(", ")}` : "",
              ].filter(Boolean).join("\n")

              return (
                <li
                  key={crs.code}
                  draggable
                  onDragStart={(e) => {
                    setDrag({ from: slot.label, code: crs.code })
                    e.dataTransfer.effectAllowed = "move"
                    e.dataTransfer.setData("text/plain", crs.code)
                  }}
                  onDragEnd={() => setDrag(null)}
                  className="flex cursor-grab items-center gap-2 rounded-md px-1 py-1.5 transition hover:bg-white/[0.04] active:cursor-grabbing"
                >
                  <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${STATUS_DOT[status]}`} title={tip} />
                  <button onClick={() => open(crs.code)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <span className="font-mono text-xs font-bold text-yellow-400">{crs.code}</span>
                    <span className="truncate text-xs text-zinc-500">{crs.name}</span>
                  </button>
                  {leadsTo.length > 0 && (
                    <span
                      className="flex-shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-1.5 text-[10px] text-zinc-400"
                      title={`Leads to: ${leadsTo.join(", ")}`}
                    >
                      →{leadsTo.length}
                    </span>
                  )}
                  <button
                    onClick={() => removeCourse(slot.label, crs.code)}
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
          <CourseSearch placeholder="Search to add a course…" onPick={(c) => addCourse(slot.label, c)} />
        </div>
      </div>
    )
  }

  const renderWork = (slot: CoopSlot) => {
    const record = coop.plan.work[slot.id]
    const online = coop.plan.onlineCourses[slot.id] ?? []
    // Only show a work term once it has something recorded on the Co-op page.
    if (!record && online.length === 0) return null

    return (
      <div key={slot.id} className={`${glassCard} border-sky-500/20 p-5`}>
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-sm font-bold text-sky-300">{slot.label}</span>
          <span className="text-[10px] uppercase tracking-wide text-zinc-600">Work term</span>
        </div>
        <p className="mb-2 text-xs text-zinc-500">
          {record?.status === "employed"
            ? record.employer || "Employed"
            : record?.status === "unemployed"
            ? "Unemployed"
            : "Online courses"}
        </p>

        {online.length > 0 && (
          <ul className="mb-2 space-y-1">
            {online.map((crs) => (
              <li key={crs.code} className="flex items-center gap-2 rounded-md px-1 py-1.5 hover:bg-white/[0.04]">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-sky-400/70" title="Online course" />
                <button onClick={() => open(crs.code)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <span className="font-mono text-xs font-bold text-yellow-400">{crs.code}</span>
                  <span className="truncate text-xs text-zinc-500">{crs.name}</span>
                </button>
                <button
                  onClick={() => coop.removeOnlineCourse(slot.id, crs.code)}
                  className="flex-shrink-0 text-xs text-zinc-600 transition hover:text-red-400"
                  aria-label={`Remove ${crs.code}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <CourseSearch placeholder="Add an online course…" onPick={(c) => coop.addOnlineCourse(slot.id, c)} />
      </div>
    )
  }

  const hasProgram = !!getProgramRequirements(meta?.program)

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Planner</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Drag courses between terms · click a course for details
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-400" /> Met</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-yellow-400" /> Needs grade</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Missing</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {slots.map((slot) =>
            slot.type === "study"
              ? renderStudy(slot)
              : slot.type === "work"
              ? renderWork(slot)
              : null
          )}
        </div>
      </div>

      {hasProgram && <RequirementsAside />}
    </div>
  )
}
