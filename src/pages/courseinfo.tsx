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
import { cardSurface, headingSm, primaryButton, subtleButton } from "../lib/ui"

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
      <div className="flex justify-center py-20 text-fog">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-gold" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <Link to="/app/courses" className="text-sm text-gold hover:brightness-110">
          ← Back to courses
        </Link>
        <div className={`${cardSurface} p-8 text-center text-sm text-fog`}>
          {error ?? "Course not found."}
        </div>
      </div>
    )
  }

  // Colour a prerequisite chip. Within an OR clause that's already satisfied,
  // the un-taken alternatives are shown neutral (you only need one).
  const chipClass = (pcode: string, minGrade: number | undefined, clauseSatisfied: boolean) => {
    if (have.has(pcode) && !minGrade) return "border-green-500/40 bg-green-500/10 text-green-300"
    if (minGrade) return "border-gold/40 bg-gold/10 text-gold"
    if (clauseSatisfied) return "border-white/[0.1] bg-white/[0.04] text-fog"
    return "border-red-500/40 bg-red-500/10 text-red-300"
  }

  const alreadyPlanned = have.has(course.code)

  return (
    <div className="space-y-6">
      <Link to="/app/courses" className="inline-block text-sm text-gold hover:brightness-110">
        ← Back to courses
      </Link>

      {/* Main content (left) + sticky plan/rating sidebar (right) at lg+. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {/* Header */}
          <div className={`${cardSurface} p-6`}>
            <span className="font-mono text-lg font-medium text-gold">{course.code}</span>
            <h1 className={`mt-2 ${headingSm}`}>{course.name}</h1>
            {course.description && (
              <p className="mt-3 text-sm leading-relaxed text-mist">{course.description}</p>
            )}
            {course.requirements && (
              <p className="mt-3 text-sm text-fog">
                <span className="font-medium text-mist">Requirements:</span> {course.requirements}
              </p>
            )}

            {/* Prerequisites — clauses are ANDed, alternatives within are ORed. */}
            {clauses.length > 0 && (
              <div className="mt-4">
                <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-fog">
                  Prerequisites
                </p>
                <div className="space-y-1.5">
                  {clauses.map((clause, ci) => {
                    const satisfied = clause.some((a) => have.has(a.code))
                    return (
                    <div key={ci} className="flex flex-wrap items-center gap-1.5">
                      {ci > 0 && <span className="mr-1 text-[10px] font-medium uppercase text-ash">and</span>}
                      {clause.map((p, ai) => (
                        <Fragment key={p.code}>
                          {ai > 0 && <span className="text-[10px] text-ash">or</span>}
                          <Link
                            to={`/app/courses/${encodeURIComponent(p.code)}`}
                            title={
                              p.minGrade
                                ? `Needs at least ${p.minGrade}%`
                                : have.has(p.code)
                                ? "Requirement met"
                                : "You haven't planned this yet"
                            }
                            className={`rounded-full border px-2.5 py-1 text-xs font-mono font-medium transition hover:brightness-125 ${chipClass(
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
                <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-fog">
                  Leads to
                </p>
                <div className="flex flex-wrap gap-2">
                  {leadsTo.map((lc) => (
                    <Link
                      key={lc}
                      to={`/app/courses/${encodeURIComponent(lc)}`}
                      className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 font-mono text-xs font-medium text-fog transition hover:border-gold/40 hover:text-gold"
                    >
                      {lc}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sections */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-bone">
              Sections {course.sections.length > 0 && `(${course.sections.length})`}
            </h2>

            {course.sections.length === 0 && (
              <div className={`${cardSurface} p-6 text-sm text-fog`}>
                No scheduled sections for this term yet.
              </div>
            )}

            {course.sections.map((s) => {
              const added = has(s.id)
              const full = s.capacity > 0 && s.enrolled >= s.capacity
              return (
                <div key={s.id} className={`${cardSurface} p-5`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-gold/20 bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold">
                          {s.type}
                        </span>
                        <span className="text-sm font-medium text-bone">{s.section}</span>
                      </div>
                      <p className="mt-1 text-xs text-fog">{s.instructor}</p>

                      <div className="mt-3 space-y-1">
                        {s.meetings.length === 0 && (
                          <p className="text-sm text-ash">Online / no fixed meeting time</p>
                        )}
                        {s.meetings.map((m, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-mist">
                            <span className="w-9 font-medium text-fog">{DAY_LABELS[m.day]}</span>
                            <span>
                              {formatTime(m.start)} – {formatTime(m.end)}
                            </span>
                            <span className="text-ash">·</span>
                            <span className="text-fog">{m.location}</span>
                          </div>
                        ))}
                      </div>

                      {s.capacity > 0 && (
                        <p className="mt-3 text-xs text-ash">
                          {s.enrolled}/{s.capacity} enrolled
                          {full && <span className="ml-2 text-red-400">Full</span>}
                        </p>
                      )}
                    </div>

                    {added ? (
                      <button
                        onClick={() => remove(s.id)}
                        className={`${subtleButton} px-4 py-2 text-sm font-medium`}
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
                        className={`${primaryButton} px-4 py-2 text-sm`}
                      >
                        Add to timetable
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <Link to="/app/timetable" className="inline-block text-sm text-gold hover:brightness-110">
            View my timetable →
          </Link>
        </div>

        {/* Sidebar: add-to-plan + UW Flow ratings, sticky at lg+. */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div className={`${cardSurface} p-5`}>
            <p className="mb-2 text-sm text-mist">Add to your plan</p>
            <div className="space-y-2.5">
              <SelectMenu
                label="Term"
                value={planTerm}
                options={[...ALL_TERM_IDS]}
                onChange={setPlanTerm}
              />
              <button
                onClick={() => addCourse(planTerm, { code: course.code, name: course.name })}
                disabled={alreadyPlanned}
                className={`${primaryButton} w-full px-4 py-2.5 text-sm`}
              >
                {alreadyPlanned ? "In your plan" : "Add to planner"}
              </button>
              <button
                onClick={() => navigate("/app/planner")}
                className={`${subtleButton} w-full px-4 py-2.5 text-sm font-medium`}
              >
                Open planner
              </button>
            </div>
          </div>

          <RatingCard code={course.code} rating={rating} />
        </div>
      </div>
    </div>
  )
}
