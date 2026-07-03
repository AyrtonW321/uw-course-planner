import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { DAY_LABELS, formatTime } from "../lib/courses"
import { useTimetable } from "../lib/timetable"
import { ALL_TERM_IDS } from "../lib/degreePlan"
import { useProfileMeta } from "../lib/profile"
import SelectMenu from "../components/SelectMenu"
import { glassCard, goldButton } from "../lib/ui"

const START = 8 * 60 // 8:00am
const END = 21 * 60 // 9:00pm
const PX_PER_MIN = 0.9
const HEIGHT = (END - START) * PX_PER_MIN

const PALETTE = [
  { bg: "rgba(250,204,21,0.14)", border: "rgba(250,204,21,0.55)", text: "#fde68a" },
  { bg: "rgba(96,165,250,0.14)", border: "rgba(96,165,250,0.55)", text: "#bfdbfe" },
  { bg: "rgba(52,211,153,0.14)", border: "rgba(52,211,153,0.55)", text: "#a7f3d0" },
  { bg: "rgba(244,114,182,0.14)", border: "rgba(244,114,182,0.55)", text: "#fbcfe8" },
  { bg: "rgba(167,139,250,0.14)", border: "rgba(167,139,250,0.55)", text: "#ddd6fe" },
  { bg: "rgba(251,146,60,0.14)", border: "rgba(251,146,60,0.55)", text: "#fed7aa" },
]

type Color = (typeof PALETTE)[number]

type CalEvent = {
  key: string
  code: string
  type: string
  day: number
  start: number
  end: number
  location: string
  color: Color
}

const HOURS = Array.from({ length: (END - START) / 60 + 1 }, (_, i) => START / 60 + i)

export default function TimetablePage() {
  const { entries, loading, remove } = useTimetable()
  const { meta, loading: profileLoading } = useProfileMeta()
  const [term, setTerm] = useState("1A")
  const inited = useRef(false)

  // On first load, open to the user's current term (from their profile).
  // Fall back to the first term that has courses, else 1A.
  useEffect(() => {
    if (inited.current || profileLoading) return
    const current = meta?.currentTerm
    if (current && ALL_TERM_IDS.includes(current)) {
      setTerm(current)
      inited.current = true
      return
    }
    if (entries.length > 0) {
      const present = new Set(entries.map((e) => e.term ?? "1A"))
      const first = ALL_TERM_IDS.find((t) => present.has(t))
      if (first) setTerm(first)
    }
    inited.current = true
  }, [meta, profileLoading, entries])

  const termEntries = useMemo(
    () => entries.filter((e) => (e.term ?? "1A") === term),
    [entries, term]
  )

  const { events, courses, totalHours } = useMemo(() => {
    const colorByCode = new Map<string, Color>()
    const courseList: { sectionId: string; code: string; title: string; color: Color }[] = []
    const evts: CalEvent[] = []
    let minutes = 0

    for (const e of termEntries) {
      if (!colorByCode.has(e.code)) {
        colorByCode.set(e.code, PALETTE[colorByCode.size % PALETTE.length])
      }
      const color = colorByCode.get(e.code)!
      courseList.push({ sectionId: e.sectionId, code: e.code, title: e.title, color })

      for (const m of e.meetings) {
        evts.push({
          key: `${e.sectionId}-${m.day}-${m.start}`,
          code: e.code,
          type: e.type,
          day: m.day,
          start: m.start,
          end: m.end,
          location: m.location,
          color,
        })
        minutes += m.end - m.start
      }
    }
    return { events: evts, courses: courseList, totalHours: minutes / 60 }
  }, [termEntries])

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-zinc-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-yellow-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Your Timetable</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {totalHours > 0
              ? `${totalHours.toFixed(1)} hours of class in ${term}`
              : `No courses in ${term}`}
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="w-24">
            <SelectMenu label="Term" value={term} options={[...ALL_TERM_IDS]} onChange={setTerm} />
          </div>
          <Link to="/app/courses" className={`${goldButton} px-4 py-2.5 text-sm`}>
            + Add courses
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
        {/* Calendar */}
        <div className={`${glassCard} overflow-hidden p-4`}>
          {/* Day headers */}
          <div className="mb-2 grid grid-cols-[48px_repeat(5,1fr)]">
            <div />
            {DAY_LABELS.map((d) => (
              <div key={d} className="px-2 text-center text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {d}
              </div>
            ))}
          </div>

          {/* Grid body */}
          <div className="grid grid-cols-[48px_repeat(5,1fr)]" style={{ height: HEIGHT }}>
            {/* Time gutter */}
            <div className="relative">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute right-1.5 -translate-y-1/2 text-[10px] text-zinc-600"
                  style={{ top: (h * 60 - START) * PX_PER_MIN }}
                >
                  {formatTime(h * 60)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAY_LABELS.map((_, dayIndex) => (
              <div key={dayIndex} className="relative border-l border-white/[0.05]">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-white/[0.04]"
                    style={{ top: (h * 60 - START) * PX_PER_MIN }}
                  />
                ))}

                {events
                  .filter((e) => e.day === dayIndex)
                  .map((e) => {
                    const top = (e.start - START) * PX_PER_MIN
                    const height = (e.end - e.start) * PX_PER_MIN
                    return (
                      <div
                        key={e.key}
                        className="absolute left-0.5 right-0.5 overflow-hidden rounded-md border px-1.5 py-1 backdrop-blur-sm"
                        style={{ top, height, backgroundColor: e.color.bg, borderColor: e.color.border }}
                        title={`${e.code} · ${e.location}`}
                      >
                        <p className="truncate text-[11px] font-bold" style={{ color: e.color.text }}>
                          {e.code}
                        </p>
                        <p className="truncate text-[9px] text-zinc-400">
                          {e.type} · {e.location}
                        </p>
                        {height > 38 && (
                          <p className="truncate text-[9px] text-zinc-500">
                            {formatTime(e.start)}–{formatTime(e.end)}
                          </p>
                        )}
                      </div>
                    )
                  })}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className={`${glassCard} p-5`}>
            <h2 className="mb-3 text-sm font-semibold text-white">Your Courses</h2>
            {courses.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Nothing here yet.{" "}
                <Link to="/app/courses" className="text-yellow-400 hover:text-yellow-300">
                  Browse courses
                </Link>{" "}
                to build your schedule.
              </p>
            ) : (
              <ul className="space-y-2">
                {courses.map((c) => (
                  <li
                    key={c.sectionId}
                    className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                  >
                    <span
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: c.color.border }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-bold text-white">{c.code}</p>
                      <p className="truncate text-[11px] text-zinc-500">{c.title}</p>
                    </div>
                    <button
                      onClick={() => remove(c.sectionId)}
                      className="flex-shrink-0 text-xs text-zinc-600 transition hover:text-red-400"
                      aria-label={`Remove ${c.code}`}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
