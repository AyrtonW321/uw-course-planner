import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useProfileMeta } from "../lib/profile"
import { useTimetable } from "../lib/timetable"
import { useDegreePlan } from "../lib/degreePlan"

// Rough target used only for the progress bar until real audit data exists.
const TARGET_COURSES = 40

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 backdrop-blur-md ${className}`}>
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
  const { totalCourses } = useDegreePlan()

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

  const pct = Math.min(100, Math.round((totalCourses / TARGET_COURSES) * 100))

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
              <p className="text-lg font-bold text-white">{totalCourses}</p>
              <p className="text-xs text-zinc-500">Planned</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] py-3">
              <p className="text-lg font-bold text-white">{Math.max(0, TARGET_COURSES - totalCourses)}</p>
              <p className="text-xs text-zinc-500">Remaining (est.)</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] py-3">
              <p className="text-lg font-bold text-white">{grad}</p>
              <p className="text-xs text-zinc-500">Target grad</p>
            </div>
          </div>
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
            “Can I graduate on time?”
          </p>
          <button
            disabled
            className="mt-4 cursor-not-allowed rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 text-sm font-medium text-zinc-500"
          >
            Coming soon
          </button>
        </Card>
      </div>

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
