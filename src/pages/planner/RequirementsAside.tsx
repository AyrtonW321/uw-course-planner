import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useProfileMeta } from "../../lib/profile"
import { useDegreePlan } from "../../lib/degreePlan"
import { useCoopPlan } from "../../lib/coop"
import {
  estimateCredit,
  getProgramRequirements,
  isMathCourse,
} from "../../lib/requirements"
import { glassCard } from "../../lib/ui"

function MiniBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-600">
          {value.toFixed(1)}/{max.toFixed(1)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/** Compact "My Degree" summary shown alongside the planner. */
export default function RequirementsAside() {
  const { meta } = useProfileMeta()
  const { plan } = useDegreePlan()
  const coop = useCoopPlan()
  const req = getProgramRequirements(meta?.program)

  const have = useMemo(() => {
    const set = new Set<string>()
    for (const list of Object.values(plan)) for (const c of list) set.add(c.code)
    for (const list of Object.values(coop.plan.onlineCourses)) for (const c of list) set.add(c.code)
    return set
  }, [plan, coop.plan.onlineCourses])

  const { math, nonMath } = useMemo(() => {
    let m = 0
    let nm = 0
    for (const code of have) {
      const u = estimateCredit(code)
      if (isMathCourse(code)) m += u
      else nm += u
    }
    return { math: m, nonMath: nm }
  }, [have])

  if (!req) return null

  return (
    <aside className="space-y-4">
      <div className={`${glassCard} space-y-3 p-4`}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">My Degree</h2>
          <Link to="/app/planner/degree" className="text-[11px] text-yellow-400 hover:text-yellow-300">
            Details
          </Link>
        </div>
        <MiniBar value={math} max={req.mathUnits} label="Math units" />
        <MiniBar value={nonMath} max={req.nonMathUnits} label="Non-math units" />
        <MiniBar value={math + nonMath} max={req.totalUnits} label="Total units" />
      </div>

      <div className={`${glassCard} p-4`}>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Required
        </h3>
        <ul className="space-y-1.5">
          {req.groups.map((g, i) => {
            if (g.kind === "choose") {
              return (
                <li key={i} className="text-[11px] text-zinc-500">
                  • {g.label}
                </li>
              )
            }
            const done =
              g.kind === "all"
                ? g.courses.every((c) => have.has(c.code))
                : g.courses.some((c) => have.has(c.code))
            return (
              <li key={i} className="flex items-start gap-2 text-[11px]">
                <span className={done ? "text-green-400" : "text-zinc-600"}>{done ? "✓" : "○"}</span>
                <span className="text-zinc-400">
                  {g.courses.map((c) => c.code).join(g.kind === "all" ? " + " : " / ")}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
