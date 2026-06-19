import { Link, useParams } from "react-router-dom"
import { DAY_LABELS, formatTime, getCourse } from "../lib/courses"
import { useTimetable } from "../lib/timetable"
import { glassCard, goldButton, glassButton } from "../lib/ui"

export default function CourseInfoPage() {
  const { code } = useParams<{ code: string }>()
  const course = code ? getCourse(decodeURIComponent(code)) : undefined
  const { has, add, remove } = useTimetable()

  if (!course) {
    return (
      <div className="space-y-4">
        <Link to="/app/courses" className="text-sm text-yellow-400 hover:text-yellow-300">
          ← Back to courses
        </Link>
        <div className={`${glassCard} p-8 text-center text-sm text-zinc-500`}>
          Course not found.
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
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg font-bold text-yellow-400">{course.code}</span>
          <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-xs text-zinc-400">
            {course.credit} credit
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">{course.name}</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{course.description}</p>
        {course.prereqs.length > 0 && (
          <p className="mt-3 text-sm text-zinc-500">
            <span className="font-semibold text-zinc-400">Prerequisites:</span>{" "}
            {course.prereqs.join(", ")}
          </p>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Sections</h2>
        {course.sections.map((s) => {
          const added = has(s.id)
          const full = s.enrolled >= s.capacity
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
                    {s.meetings.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                        <span className="w-9 font-medium text-zinc-400">
                          {DAY_LABELS[m.day]}
                        </span>
                        <span>
                          {formatTime(m.start)} – {formatTime(m.end)}
                        </span>
                        <span className="text-zinc-600">·</span>
                        <span className="text-zinc-500">{m.location}</span>
                      </div>
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-zinc-600">
                    {s.enrolled}/{s.capacity} enrolled
                    {full && <span className="ml-2 text-red-400">Full</span>}
                  </p>
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
                    onClick={() => add(s.id)}
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

      <Link
        to="/app/timetable"
        className="inline-block text-sm text-yellow-400 hover:text-yellow-300"
      >
        View my timetable →
      </Link>
    </div>
  )
}
