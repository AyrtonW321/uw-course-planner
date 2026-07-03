import { Fragment, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { DAY_LABELS, formatTime, type Course } from "../lib/courses"
import { getCourseWithSections, getTermInfo } from "../lib/catalog"
import { useTimetable } from "../lib/timetable"
import { ALL_TERM_IDS, useDegreePlan } from "../lib/degreePlan"
import { useCompleted } from "../lib/completed"
import { PREREQS } from "../lib/requirements"
import { parsePrereqClauses } from "../lib/prereqParser"
import { usePrereqIndex } from "../lib/usePrereq"
import { useCourseRating } from "../lib/uwflow"
import { RatingCard } from "../components/CourseRating"
import SelectMenu from "../components/SelectMenu"
import { glassCard, goldButton, glassButton } from "../lib/ui"

export default function CourseInfoPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const decoded = code ? decodeURIComponent(code) : ""

  const [course, setCourse] = useState<Course | null>(null)
  const [termCode, setTermCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [planTerm, setPlanTerm] = useState("1A")

  const { has, add, remove } = useTimetable()
  const { plan, addCourse } = useDegreePlan()
  const { codes: completedCodes } = useCompleted()
  const { leadsTo: leadsToIndex } = usePrereqIndex()
  const { rating } = useCourseRating(decoded)

  // Everything the student has completed or planned — used to colour prereqs.
  const have = useMemo(() => {
    const set = new Set<string>(completedCodes)
    for (const list of Object.values(plan)) for (const c of list) set.add(c.code)
    return set
  }, [plan, completedCodes])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    getTermInfo()
      .then((t) => {
        if (active) setTermCode(t.termCode)
        return getCourseWithSections(t.termCode, decoded)
      })
      .then((c) => {
        if (!active) return
        setCourse(c ?? null)
        if (!c) setError("Course not found.")
      })
      .catch((e) => active && setError(e?.message ?? "Failed to load course."))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [decoded])

  // Parse the course's requirements into AND-clauses of OR-alternatives;
  // fall back to hand-curated prereqs (as single-alternative clauses).
  const clauses = useMemo(() => {
    const parsed = parsePrereqClauses(course?.requirements)
    if (parsed.length) return parsed
    return (PREREQS[decoded] ?? []).map((rc) => [rc])
  }, [decoded, course])
  const leadsTo = useMemo(() => leadsToIndex(decoded), [decoded, leadsToIndex])

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-zinc-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-yellow-400" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <Link to="/app/courses" className="text-sm text-yellow-400 hover:text-yellow-300">
          ← Back to courses
        </Link>
        <div className={`${glassCard} p-8 text-center text-sm text-zinc-500`}>
          {error ?? "Course not found."}
        </div>
      </div>
    )
  }

  // Colour a prerequisite chip. Within an OR clause that's already satisfied,
  // the un-taken alternatives are shown neutral (you only need one).
  const chipClass = (pcode: string, minGrade: number | undefined, clauseSatisfied: boolean) => {
    if (have.has(pcode) && !minGrade) return "border-green-500/40 bg-green-500/10 text-green-300"
    if (minGrade) return "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
    if (clauseSatisfied) return "border-white/[0.1] bg-white/[0.04] text-zinc-400"
    return "border-red-500/40 bg-red-500/10 text-red-300"
  }

  const alreadyPlanned = have.has(course.code)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/app/courses" className="inline-block text-sm text-yellow-400 hover:text-yellow-300">
        ← Back to courses
      </Link>

      {/* Header */}
      <div className={`${glassCard} p-6`}>
        <span className="font-mono text-lg font-bold text-yellow-400">{course.code}</span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">{course.name}</h1>
        {course.description && (
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">{course.description}</p>
        )}
        {course.requirements && (
          <p className="mt-3 text-sm text-zinc-500">
            <span className="font-semibold text-zinc-400">Requirements:</span> {course.requirements}
          </p>
        )}

        {/* Prerequisites — clauses are ANDed, alternatives within are ORed. */}
        {clauses.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Prerequisites
            </p>
            <div className="space-y-1.5">
              {clauses.map((clause, ci) => {
                const satisfied = clause.some((a) => have.has(a.code))
                return (
                <div key={ci} className="flex flex-wrap items-center gap-1.5">
                  {ci > 0 && <span className="mr-1 text-[10px] font-semibold uppercase text-zinc-600">and</span>}
                  {clause.map((p, ai) => (
                    <Fragment key={p.code}>
                      {ai > 0 && <span className="text-[10px] text-zinc-600">or</span>}
                      <Link
                        to={`/app/courses/${encodeURIComponent(p.code)}`}
                        title={
                          p.minGrade
                            ? `Needs at least ${p.minGrade}%`
                            : have.has(p.code)
                            ? "Requirement met"
                            : "You haven't planned this yet"
                        }
                        className={`rounded-full border px-2.5 py-1 text-xs font-mono font-semibold transition hover:brightness-125 ${chipClass(
                          p.code,
                          p.minGrade,
                          satisfied
                        )}`}
                      >
                        {p.code}
                        {p.minGrade ? ` ≥${p.minGrade}%` : ""}
                      </Link>
                    </Fragment>
                  ))}
                </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Leads to */}
        {leadsTo.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Leads to
            </p>
            <div className="flex flex-wrap gap-2">
              {leadsTo.map((lc) => (
                <Link
                  key={lc}
                  to={`/app/courses/${encodeURIComponent(lc)}`}
                  className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 font-mono text-xs font-semibold text-zinc-300 transition hover:border-yellow-500/40 hover:text-yellow-300"
                >
                  {lc}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Add to degree planner */}
        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <p className="mb-2 text-sm text-zinc-400">Add to your plan</p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-28">
              <SelectMenu
                label="Term"
                value={planTerm}
                options={[...ALL_TERM_IDS]}
                onChange={setPlanTerm}
              />
            </div>
            <button
              onClick={() => addCourse(planTerm, { code: course.code, name: course.name })}
              disabled={alreadyPlanned}
              className={`${goldButton} px-4 py-2.5 text-sm`}
            >
              {alreadyPlanned ? "In your plan" : "Add to planner"}
            </button>
            <button
              onClick={() => navigate("/app/planner")}
              className={`${glassButton} px-4 py-2.5 text-sm font-medium`}
            >
              Open planner
            </button>
          </div>
        </div>
      </div>

      {/* UW Flow ratings */}
      <RatingCard code={course.code} rating={rating} />

      {/* Sections */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white">
          Sections {course.sections.length > 0 && `(${course.sections.length})`}
        </h2>

        {course.sections.length === 0 && (
          <div className={`${glassCard} p-6 text-sm text-zinc-500`}>
            No scheduled sections for this term yet.
          </div>
        )}

        {course.sections.map((s) => {
          const added = has(s.id)
          const full = s.capacity > 0 && s.enrolled >= s.capacity
          return (
            <div key={s.id} className={`${glassCard} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-xs font-semibold text-yellow-400">
                      {s.type}
                    </span>
                    <span className="text-sm font-medium text-white">{s.section}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{s.instructor}</p>

                  <div className="mt-3 space-y-1">
                    {s.meetings.length === 0 && (
                      <p className="text-sm text-zinc-600">Online / no fixed meeting time</p>
                    )}
                    {s.meetings.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                        <span className="w-9 font-medium text-zinc-400">{DAY_LABELS[m.day]}</span>
                        <span>
                          {formatTime(m.start)} – {formatTime(m.end)}
                        </span>
                        <span className="text-zinc-600">·</span>
                        <span className="text-zinc-500">{m.location}</span>
                      </div>
                    ))}
                  </div>

                  {s.capacity > 0 && (
                    <p className="mt-3 text-xs text-zinc-600">
                      {s.enrolled}/{s.capacity} enrolled
                      {full && <span className="ml-2 text-red-400">Full</span>}
                    </p>
                  )}
                </div>

                {added ? (
                  <button
                    onClick={() => remove(s.id)}
                    className={`${glassButton} px-4 py-2 text-sm font-medium`}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      add({
                        sectionId: s.id,
                        code: course.code,
                        title: course.name,
                        type: s.type,
                        section: s.section,
                        termCode,
                        term: planTerm,
                        instructor: s.instructor,
                        meetings: s.meetings,
                      })
                    }
                    className={`${goldButton} px-4 py-2 text-sm`}
                  >
                    Add to timetable
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Link to="/app/timetable" className="inline-block text-sm text-yellow-400 hover:text-yellow-300">
        View my timetable →
      </Link>
    </div>
  )
}
