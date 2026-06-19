import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { DAY_LABELS, formatTime, type Course } from "../lib/courses"
import { getCourseWithSections, getTermInfo } from "../lib/catalog"
import { useTimetable } from "../lib/timetable"
import { glassCard, goldButton, glassButton } from "../lib/ui"

export default function CourseInfoPage() {
  const { code } = useParams<{ code: string }>()
  const decoded = code ? decodeURIComponent(code) : ""

  const [course, setCourse] = useState<Course | null>(null)
  const [termCode, setTermCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { has, add, remove } = useTimetable()

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
        {(course.requirements || course.prereqs.length > 0) && (
          <p className="mt-3 text-sm text-zinc-500">
            <span className="font-semibold text-zinc-400">Requirements:</span>{" "}
            {course.requirements ?? course.prereqs.join(", ")}
          </p>
        )}
      </div>

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
