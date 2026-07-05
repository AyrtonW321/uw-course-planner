import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useProfileMeta } from "../../lib/profile"
import { fmtUnits, useDegreePlan } from "../../lib/degreePlan"
import { useCompleted } from "../../lib/completed"
import {
  BMATH_DEGREE_LEVEL,
  estimateCredit,
  getProgramRequirements,
  isMathCourse,
  type ReqGroup,
} from "../../lib/requirements"
import { glassCard } from "../../lib/ui"

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-500">
          {fmtUnits(value)} / {fmtUnits(max)} units
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function GroupCard({ group, have }: { group: ReqGroup; have: Set<string> }) {
  if (group.kind === "choose") {
    return (
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <p className="text-sm text-zinc-300">{group.label}</p>
        <p className="mt-0.5 text-xs text-zinc-600">Tracked manually</p>
      </div>
    )
  }

  const done =
    group.kind === "all"
      ? group.courses.every((c) => have.has(c.code))
      : group.courses.some((c) => have.has(c.code))

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-300">{group.label}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            done
              ? "border border-green-500/30 bg-green-500/10 text-green-400"
              : "border border-white/[0.08] bg-white/[0.03] text-zinc-500"
          }`}
        >
          {done ? "Complete" : group.kind === "all" ? "All required" : "Choose one"}
        </span>
      </div>
      <ul className="space-y-1">
        {group.courses.map((c) => {
          const has = have.has(c.code)
          return (
            <li key={c.code} className="flex items-center gap-2 text-sm">
              <span className={has ? "text-green-400" : "text-zinc-600"}>{has ? "✓" : "○"}</span>
              <span className="font-mono text-xs font-bold text-yellow-400">{c.code}</span>
              <span className="truncate text-xs text-zinc-500">{c.name}</span>
              {c.credit && <span className="ml-auto text-[10px] text-zinc-600">{c.credit}</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function MyDegree() {
  const { meta } = useProfileMeta()
  const { plan } = useDegreePlan()
  const { passedCodes, failedCodes } = useCompleted()

  // Passed completed + planned courses, excluding failed ones (no credit).
  const have = useMemo(() => {
    const set = new Set<string>(passedCodes)
    for (const list of Object.values(plan))
      for (const c of list) if (!failedCodes.has(c.code)) set.add(c.code)
    return set
  }, [plan, passedCodes, failedCodes])

  const { mathUnits, nonMathUnits } = useMemo(() => {
    let m = 0
    let nm = 0
    for (const code of have) {
      const u = estimateCredit(code)
      if (isMathCourse(code)) m += u
      else nm += u
    }
    return { mathUnits: m, nonMathUnits: nm }
  }, [have])

  const req = getProgramRequirements(meta?.program)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {meta?.program || "My Degree"}
        </h1>
        {req && <p className="mt-1 text-sm text-zinc-500">{req.degree}</p>}
      </div>

      {!req ? (
        <div className={`${glassCard} p-8 text-center`}>
          <p className="text-sm text-zinc-400">
            Structured requirements for{" "}
            <span className="text-white">{meta?.program || "your program"}</span> haven't
            been added yet.
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            The Bachelor of Mathematics degree-level requirements below still apply.
          </p>
        </div>
      ) : (
        <>
          {/* Graduation progress */}
          <div className={`${glassCard} space-y-4 p-5`}>
            <h2 className="text-sm font-semibold text-white">Graduation Requirements</h2>
            <ProgressBar value={mathUnits} max={req.mathUnits} label="Math units" />
            <ProgressBar value={nonMathUnits} max={req.nonMathUnits} label="Non-math units" />
            <ProgressBar
              value={mathUnits + nonMathUnits}
              max={req.totalUnits}
              label="Total units"
            />
            <ul className="mt-2 space-y-1">
              {req.graduationRequirements.map((g, i) => (
                <li key={i} className="flex gap-2 text-xs text-zinc-500">
                  <span className="text-zinc-600">•</span>
                  {g}
                </li>
              ))}
            </ul>
            <p className="text-xs text-zinc-600">
              Units are estimated from your{" "}
              <Link to="/app/planner" className="text-yellow-400 hover:text-yellow-300">
                planned courses
              </Link>
              .
            </p>
          </div>

          {/* Systems of study + averages */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={`${glassCard} p-5`}>
              <h2 className="mb-2 text-sm font-semibold text-white">Systems of Study</h2>
              <ul className="space-y-1 text-sm text-zinc-400">
                {req.systemsOfStudy.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div className={`${glassCard} p-5`}>
              <h2 className="mb-2 text-sm font-semibold text-white">Minimum Averages</h2>
              <ul className="space-y-1 text-sm text-zinc-400">
                {req.minAverages.map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-zinc-600">•</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Required courses */}
          <div className={`${glassCard} p-5`}>
            <h2 className="mb-3 text-sm font-semibold text-white">Required Courses</h2>
            <div className="space-y-3">
              {req.groups.map((g, i) => (
                <GroupCard key={i} group={g} have={have} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Degree-level requirements (always shown) */}
      <div className={`${glassCard} p-5`}>
        <h2 className="mb-3 text-sm font-semibold text-white">
          Bachelor of Mathematics — Degree-Level Requirements
        </h2>
        <ul className="space-y-1.5">
          {BMATH_DEGREE_LEVEL.map((r, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-400">
              <span className="text-zinc-600">•</span>
              {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
