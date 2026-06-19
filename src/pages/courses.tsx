import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import Combobox from "../components/Combobox"
import {
  getTermInfo,
  listCoursesBySubject,
  listSubjects,
  USE_API,
} from "../lib/catalog"
import type { Course } from "../lib/courses"
import { useTimetable } from "../lib/timetable"
import { useCourseRatings } from "../lib/uwflow"
import { RatingBadges } from "../components/CourseRating"
import { glassCard, glassInput } from "../lib/ui"

export default function CoursesPage() {
  const [params, setParams] = useSearchParams()
  const initialQ = params.get("q") ?? ""

  const [term, setTerm] = useState<{ termCode: string; name: string } | null>(null)
  const [subjects, setSubjects] = useState<{ code: string; name: string }[]>([])
  const [subject, setSubject] = useState("")
  const [filter, setFilter] = useState("")
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { entries } = useTimetable()
  const addedCodes = useMemo(
    () => new Set(entries.map((e) => e.code)),
    [entries]
  )

  // Load term + subjects once. Seed subject/filter from the navbar `?q=`.
  useEffect(() => {
    let active = true
    Promise.all([getTermInfo(), listSubjects()])
      .then(([t, subs]) => {
        if (!active) return
        setTerm(t)
        setSubjects(subs)

        const q = initialQ.trim()
        const m = q.match(/^([A-Za-z]+)\s*(.*)$/)
        const guess = m?.[1]?.toUpperCase()
        if (guess && subs.some((s) => s.code === guess)) {
          setSubject(guess)
          setFilter(m?.[2] ?? "")
        } else {
          setSubject(subs.find((s) => s.code === "CS")?.code ?? subs[0]?.code ?? "")
          setFilter(q)
        }
      })
      .catch((e) => active && setError(e?.message ?? "Failed to load catalog."))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load courses whenever the subject changes.
  useEffect(() => {
    if (!term || !subject) return
    let active = true
    setLoading(true)
    setError(null)
    listCoursesBySubject(term.termCode, subject)
      .then((cs) => active && setCourses(cs))
      .catch((e) => active && setError(e?.message ?? "Failed to load courses."))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [term, subject])

  const results = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return courses
    return courses.filter(
      (c) =>
        c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    )
  }, [courses, filter])

  // UW Flow ratings for the courses currently shown.
  const ratings = useCourseRatings(useMemo(() => results.map((c) => c.code), [results]))

  const onFilter = (value: string) => {
    setFilter(value)
    setParams(value ? { q: `${subject} ${value}`.trim() } : {}, { replace: true })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Courses</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {term ? term.name : "Loading term…"}
            {!USE_API && " · sample data (no API key)"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[220px_1fr]">
        <Combobox
          label="Subject"
          value={subject}
          placeholder="Type a subject (e.g. CS)"
          options={subjects.map((s) => ({ value: s.code, label: s.name }))}
          onChange={(code) => {
            setSubject(code)
            setFilter("")
            setParams({}, { replace: true })
          }}
        />
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Filter
          </label>
          <input
            type="text"
            value={filter}
            onChange={(e) => onFilter(e.target.value)}
            placeholder="Filter by number or title (e.g. 136, Algorithm)"
            className={glassInput}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-zinc-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-yellow-400" />
        </div>
      ) : (
        <>
          <p className="text-xs text-zinc-600">
            {results.length} course{results.length === 1 ? "" : "s"}
          </p>
          <div className="max-h-[34rem] overflow-y-auto rounded-2xl border border-white/[0.06] bg-white/[0.01] p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((c) => (
              <Link
                key={c.code}
                to={`/app/courses/${encodeURIComponent(c.code)}`}
                className={`${glassCard} group block p-4 transition hover:border-yellow-500/30 hover:bg-white/[0.06]`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-mono text-sm font-bold text-yellow-400">
                      {c.code}
                    </span>
                    <p className="mt-1 text-sm font-medium text-white">{c.name}</p>
                  </div>
                  {addedCodes.has(c.code) && (
                    <span className="flex-shrink-0 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-400">
                      Added
                    </span>
                  )}
                </div>
                {c.description && (
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                    {c.description}
                  </p>
                )}
                <div className="mt-2">
                  <RatingBadges rating={ratings.get(c.code) ?? null} />
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-zinc-600">
                  {c.requirements && (
                    <span className="line-clamp-1">{c.requirements}</span>
                  )}
                  <span className="ml-auto flex-shrink-0 text-yellow-400/70 transition group-hover:text-yellow-400">
                    View →
                  </span>
                </div>
              </Link>
            ))}

            {results.length === 0 && (
              <div className={`${glassCard} p-8 text-center text-sm text-zinc-500 sm:col-span-2 lg:col-span-3`}>
                No courses found.
              </div>
            )}
          </div>
          </div>
        </>
      )}
    </div>
  )
}
