import { Fragment, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import CourseSearch from "../../components/CourseSearch"
import LeadsToPopover from "../../components/LeadsToPopover"
import { useDegreePlan } from "../../lib/degreePlan"
import { useCoopPlan, type CoopSlot } from "../../lib/coop"
import { useCompleted } from "../../lib/completed"
import { useProfileMeta } from "../../lib/profile"
import {
  estimateCredit,
  getProgramRequirements,
  statusForClauses,
  type PrereqStatus,
} from "../../lib/requirements"
import { usePrereqIndex } from "../../lib/usePrereq"
import { glassCard } from "../../lib/ui"
import RequirementsAside from "./RequirementsAside"

const STATUS_DOT: Record<PrereqStatus, string> = {
  met: "bg-green-400",
  grade: "bg-yellow-400",
  missing: "bg-red-400",
}

type DragState = { from: string; code: string } | null
type HoverState = { term: string; index: number } | null

export default function PlannerTerms() {
  const navigate = useNavigate()
  const { plan, loading, addCourse, removeCourse, moveCourse } = useDegreePlan()
  const { meta } = useProfileMeta()
  const coop = useCoopPlan()
  const { resolve, leadsTo } = usePrereqIndex()
  const { codes: completedCodes, grades } = useCompleted()
  const slots = coop.slots
  const [drag, setDrag] = useState<DragState>(null)
  const [hover, setHover] = useState<HoverState>(null)
  const [asideOpen, setAsideOpen] = useState(true)

  // Cumulative course codes taken before each slot. Seeded with completed
  // courses, which count as done regardless of term.
  const haveBeforeSlot = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    const acc = new Set<string>(completedCodes)
    for (const slot of slots) {
      map[slot.id] = new Set(acc)
      if (slot.type === "study") for (const c of plan[slot.label] ?? []) acc.add(c.code)
      if (slot.type === "work") for (const c of coop.plan.onlineCourses[slot.id] ?? []) acc.add(c.code)
    }
    return map
  }, [slots, plan, coop.plan.onlineCourses, completedCodes])

  if (loading || coop.loading) {
    return (
      <div className="flex justify-center py-20 text-zinc-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-yellow-400" />
      </div>
    )
  }

  const open = (code: string) => navigate(`/app/courses/${encodeURIComponent(code)}`)

  const drop = (term: string) => {
    if (drag) moveCourse(drag.from, term, drag.code, hover?.term === term ? hover.index : undefined)
    setDrag(null)
    setHover(null)
  }

  // Green insertion line shown between courses while dragging.
  const indicator = (term: string, i: number) =>
    drag && hover?.term === term && hover.index === i ? (
      <li className="my-0.5 h-0.5 rounded-full bg-green-400" />
    ) : null

  const renderStudy = (slot: CoopSlot) => {
    const courses = plan[slot.label] ?? []
    const have = haveBeforeSlot[slot.id] ?? new Set<string>()
    const isTarget = !!drag

    return (
      <div
        key={slot.id}
        onDragOver={(e) => {
          if (!isTarget) return
          e.preventDefault()
          e.dataTransfer.dropEffect = "move"
          if (courses.length === 0) setHover({ term: slot.label, index: 0 })
        }}
        onDrop={(e) => {
          e.preventDefault()
          drop(slot.label)
        }}
        className={`${glassCard} p-5 transition ${
          isTarget && drag?.from !== slot.label ? "border-yellow-500/30" : ""
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-sm font-bold text-white">{slot.label}</span>
          <span className="text-xs text-zinc-600">
            {courses.reduce((u, c) => u + estimateCredit(c.code), 0).toFixed(2)} units
          </span>
        </div>

        {courses.length === 0 ? (
          <ul>
            {indicator(slot.label, 0)}
            <li className="py-2 text-xs text-zinc-600">Drag or search to add courses.</li>
          </ul>
        ) : (
          <ul>
            {courses.map((crs, i) => {
              const clauses = resolve(crs.code)
              const status = statusForClauses(clauses, have, grades)
              const lt = leadsTo(crs.code)
              const tip = [
                status === "met" ? "Prerequisites met" : status === "grade" ? "Prereq needs a grade" : "Missing a prerequisite",
                clauses.length
                  ? `Prereqs: ${clauses
                      .map((cl) => cl.map((p) => p.code + (p.minGrade ? ` (≥${p.minGrade}%)` : "")).join(" or "))
                      .join("; and ")}`
                  : "No prerequisites",
              ].filter(Boolean).join("\n")

              return (
                <Fragment key={crs.code}>
                  {indicator(slot.label, i)}
                  <li
                    draggable
                    onDragStart={(e) => {
                      setDrag({ from: slot.label, code: crs.code })
                      e.dataTransfer.effectAllowed = "move"
                      e.dataTransfer.setData("text/plain", crs.code)
                    }}
                    onDragEnd={() => {
                      setDrag(null)
                      setHover(null)
                    }}
                    onDragOver={(e) => {
                      if (!drag) return
                      e.preventDefault()
                      const r = e.currentTarget.getBoundingClientRect()
                      const before = e.clientY < r.top + r.height / 2
                      setHover({ term: slot.label, index: before ? i : i + 1 })
                    }}
                    className="flex cursor-grab items-center gap-2 rounded-md px-1 py-1.5 transition hover:bg-white/[0.04] active:cursor-grabbing"
                  >
                    <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${STATUS_DOT[status]}`} title={tip} />
                    <button onClick={() => open(crs.code)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                      <span className="font-mono text-xs font-bold text-yellow-400">{crs.code}</span>
                      <span className="truncate text-xs text-zinc-500">{crs.name}</span>
                    </button>
                    {lt.length > 0 && <LeadsToPopover codes={lt} />}
                    <button
                      onClick={() => removeCourse(slot.label, crs.code)}
                      className="flex-shrink-0 text-xs text-zinc-600 transition hover:text-red-400"
                      aria-label={`Remove ${crs.code}`}
                    >
                      ✕
                    </button>
                  </li>
                </Fragment>
              )
            })}
            {indicator(slot.label, courses.length)}
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
    // Show a work term on the planner only once it has real content.
    const hasContent =
      online.length > 0 || record?.status === "employed" || !!record?.employer?.trim()
    if (!hasContent) return null

    return (
      <div key={slot.id} className={`${glassCard} border-sky-500/20 p-5`}>
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-sm font-bold text-sky-300">{slot.label}</span>
          <span className="text-[10px] uppercase tracking-wide text-zinc-600">Work term</span>
        </div>
        <p className="mb-2 text-xs text-zinc-500">
          {record?.status === "employed" ? record.employer || "Employed" : "Online courses"}
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
  const showAside = hasProgram && asideOpen

  return (
    <div className={`grid grid-cols-1 gap-6 ${showAside ? "xl:grid-cols-[1fr_320px]" : ""}`}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Planner</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Drag courses to reorder or move terms · click a course for details
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-400" /> Met</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-yellow-400" /> Needs grade</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Missing</span>
            {hasProgram && !asideOpen && (
              <button
                onClick={() => setAsideOpen(true)}
                className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 font-medium text-zinc-300 transition hover:border-yellow-500/30 hover:text-yellow-300"
              >
                Show My Degree
              </button>
            )}
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

      {showAside && <RequirementsAside onCollapse={() => setAsideOpen(false)} />}
    </div>
  )
}
