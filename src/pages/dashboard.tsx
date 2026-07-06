import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useProfileMeta } from "../lib/profile"
import { useTimetable } from "../lib/timetable"
import { ALL_TERM_IDS, termProgressPct } from "../lib/degreePlan"
import { getSequence, useCoopPlan } from "../lib/coop"

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-2 truncate text-2xl font-bold text-white" title={value}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </Card>
  )
}

export default function Dashboard() {
  const { user, meta } = useProfileMeta()
  const { entries } = useTimetable()
  const { plan: coopPlan, slots: coopSlots } = useCoopPlan()
  const sequenceLabel = coopPlan.slots?.length ? "Custom" : getSequence(coopPlan.sequenceId).label

  const name = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "there"

  const program = meta?.program || "Your program"
  const subtitle = [meta?.faculty, meta?.program].filter(Boolean).join(" · ") || "Set up your profile"
  const grad = meta?.gradTerm && meta?.gradYear ? `${meta.gradTerm} ${meta.gradYear}` : "—"
  const coop = meta?.coop === "no" ? "Regular" : "Co-op"

  // Unique courses currently on the timetable.
  const timetableCourses = useMemo(() => {
    const seen = new Map<string, string>()
    for (const e of entries) if (!seen.has(e.code)) seen.set(e.code, e.title)
    return [...seen.entries()].map(([code, title]) => ({ code, title }))
  }, [entries])

  // Degree progress is driven by the student's current term (index / 8).
  const currentTerm = meta?.currentTerm || ""
  const termIndex = currentTerm ? ALL_TERM_IDS.indexOf(currentTerm) : -1
  const pct = termProgressPct(currentTerm)
  const termsDone = termIndex >= 0 ? termIndex : 0
  const termsLeft = termIndex >= 0 ? ALL_TERM_IDS.length - termIndex : ALL_TERM_IDS.length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {greeting()}, {name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        </div>
        <Link
          to="/app/planner"
          className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-yellow-300"
        >
          Open Degree Planner
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Program" value={program} sub={meta?.faculty || ""} />
        <StatCard label="Co-op" value={coop} />
        <StatCard label="Graduation" value={grad} />
        <StatCard label="On Timetable" value={String(timetableCourses.length)} sub="courses" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Degree progress */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Degree Progress</h2>
            <span className="text-xs text-zinc-500">{pct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-white/[0.03] py-3">
              <p className="text-lg font-bold text-white">{currentTerm || "—"}</p>
              <p className="text-xs text-zinc-500">Current term</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] py-3">
              <p className="text-lg font-bold text-white">{termsDone}</p>
              <p className="text-xs text-zinc-500">Terms completed</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] py-3">
              <p className="text-lg font-bold text-white">{termsLeft}</p>
              <p className="text-xs text-zinc-500">Terms remaining</p>
            </div>
          </div>
          {!currentTerm && (
            <p className="mt-3 text-xs text-zinc-600">
              Set your current term in{" "}
              <Link to="/app/profile" className="text-yellow-400 hover:text-yellow-300">
                your profile
              </Link>{" "}
              to track progress.
            </p>
          )}
          <Link
            to="/app/planner"
            className="mt-4 inline-block text-xs text-yellow-400 hover:text-yellow-300"
          >
            Plan your terms →
          </Link>
        </Card>

        {/* AI Advisor teaser */}
        <Card className="flex flex-col">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-yellow-500/10 text-xs font-bold text-yellow-400">
              AI
            </span>
            <h2 className="text-sm font-semibold text-white">Academic Advisor</h2>
          </div>
          <p className="flex-1 text-sm text-zinc-500">
            Ask anything about your degree — “What should I take next term?” or
            “Which electives fit machine learning?”
          </p>
          <Link
            to="/app/advisor"
            className="mt-4 rounded-lg bg-yellow-400 py-2 text-center text-sm font-bold text-black transition hover:bg-yellow-300"
          >
            Open Advisor
          </Link>
        </Card>
      </div>

      {/* Co-op sequence strip */}
      {meta?.coop === "yes" && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Co-op Sequence · {sequenceLabel}
            </h2>
            <Link to="/app/planner/coop" className="text-xs text-yellow-400 hover:text-yellow-300">
              Manage
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {coopSlots.map((slot) => (
              <span
                key={slot.id}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  slot.type === "study"
                    ? "border border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
                    : slot.type === "work"
                    ? "border border-sky-500/30 bg-sky-500/10 text-sky-300"
                    : "border border-white/[0.1] bg-white/[0.04] text-zinc-400"
                }`}
              >
                {slot.label}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Timetable + quick actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Your Timetable</h2>
            <Link to="/app/timetable" className="text-xs text-yellow-400 hover:text-yellow-300">
              View
            </Link>
          </div>
          {timetableCourses.length === 0 ? (
            <p className="py-4 text-sm text-zinc-500">
              No courses on your timetable yet.{" "}
              <Link to="/app/courses" className="text-yellow-400 hover:text-yellow-300">
                Browse courses
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {timetableCourses.map((c) => (
                <li key={c.code} className="flex items-center gap-3 py-2.5">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full bg-yellow-400" />
                  <span className="font-mono text-sm font-medium text-white">{c.code}</span>
                  <span className="truncate text-sm text-zinc-500">{c.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Quick actions */}
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-white">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: "Browse courses", to: "/app/courses" },
              { label: "Degree planner", to: "/app/planner" },
              { label: "View timetable", to: "/app/timetable" },
              { label: "Profile settings", to: "/app/profile" },
            ].map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-zinc-300 transition hover:border-yellow-500/30 hover:bg-white/[0.05] hover:text-white"
              >
                {a.label}
                <span className="text-zinc-600">→</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
