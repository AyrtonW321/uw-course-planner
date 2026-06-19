import { Link } from "react-router-dom"
import { useAuthUser } from "../lib/useAuthUser"

/**
 * Dashboard
 * ---------
 * NOTE: The figures below are placeholders. Wire them to Firestore
 * (users/{uid}: completedCourses, plannedCourses, program, etc.) once
 * the data layer is in place. Each card is built to drop in real data.
 */

// --- Placeholder data (replace with Firestore reads) ---
const PROGRESS = {
  program: "BMath — Applied Mathematics",
  creditsDone: 9.5,
  creditsTotal: 20,
  currentTerm: "2A",
  average: 84,
}

const CURRENT_TERM_COURSES = [
  { code: "AMATH 250", name: "Intro to Differential Equations", status: "eligible" },
  { code: "CS 245", name: "Logic and Computation", status: "eligible" },
  { code: "STAT 230", name: "Probability", status: "eligible" },
  { code: "AMATH 242", name: "Intro to Computational Math", status: "warning" },
] as const

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </Card>
  )
}

export default function Dashboard() {
  const { user } = useAuthUser()
  const name = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "there"

  const pct = Math.round((PROGRESS.creditsDone / PROGRESS.creditsTotal) * 100)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {greeting()}, {name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{PROGRESS.program}</p>
        </div>
        <Link
          to="/app/timetable"
          className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-yellow-300"
        >
          Open Planner
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Current Term" value={PROGRESS.currentTerm} sub="Fall 2026" />
        <StatCard
          label="Credits"
          value={`${PROGRESS.creditsDone} / ${PROGRESS.creditsTotal}`}
          sub={`${pct}% complete`}
        />
        <StatCard label="Average" value={`${PROGRESS.average}%`} sub="Cumulative" />
        <StatCard label="Courses Planned" value="4" sub="This term" />
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
              <p className="text-lg font-bold text-white">{PROGRESS.creditsDone}</p>
              <p className="text-xs text-zinc-500">Completed</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] py-3">
              <p className="text-lg font-bold text-white">
                {(PROGRESS.creditsTotal - PROGRESS.creditsDone).toFixed(1)}
              </p>
              <p className="text-xs text-zinc-500">Remaining</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] py-3">
              <p className="text-lg font-bold text-white">~5</p>
              <p className="text-xs text-zinc-500">Terms left</p>
            </div>
          </div>
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

      {/* Current term + quick actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Current term courses */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Current Term — {PROGRESS.currentTerm}
            </h2>
            <Link to="/app/timetable" className="text-xs text-yellow-400 hover:text-yellow-300">
              Edit
            </Link>
          </div>
          <ul className="divide-y divide-white/[0.05]">
            {CURRENT_TERM_COURSES.map((c) => (
              <li key={c.code} className="flex items-center gap-3 py-2.5">
                <span
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${
                    c.status === "eligible" ? "bg-green-400" : "bg-yellow-400"
                  }`}
                  title={c.status === "eligible" ? "Prerequisites met" : "Check prerequisites"}
                />
                <span className="font-mono text-sm font-medium text-white">{c.code}</span>
                <span className="truncate text-sm text-zinc-500">{c.name}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-4 text-xs text-zinc-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400" /> Eligible
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-yellow-400" /> Check prereqs
            </span>
          </div>
        </Card>

        {/* Quick actions */}
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-white">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: "Add a course", to: "/app/timetable" },
              { label: "View timetable", to: "/app/timetable" },
              { label: "Degree audit", to: "/app" },
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
