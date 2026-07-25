import { useMemo } from "react"
import { DAY_LABELS, formatTime } from "../lib/courses"
import type { TimetableEntry } from "../lib/timetable"

const START = 8 * 60 // 8:00am
const END = 21 * 60 // 9:00pm

const PALETTE = [
  { bg: "rgba(250,204,21,0.14)", border: "rgba(250,204,21,0.55)", text: "#fde68a" },
  { bg: "rgba(96,165,250,0.14)", border: "rgba(96,165,250,0.55)", text: "#bfdbfe" },
  { bg: "rgba(52,211,153,0.14)", border: "rgba(52,211,153,0.55)", text: "#a7f3d0" },
  { bg: "rgba(244,114,182,0.14)", border: "rgba(244,114,182,0.55)", text: "#fbcfe8" },
  { bg: "rgba(167,139,250,0.14)", border: "rgba(167,139,250,0.55)", text: "#ddd6fe" },
  { bg: "rgba(251,146,60,0.14)", border: "rgba(251,146,60,0.55)", text: "#fed7aa" },
]

type Color = (typeof PALETTE)[number]

const HOURS = Array.from({ length: (END - START) / 60 + 1 }, (_, i) => START / 60 + i)

type Props = {
  entries: TimetableEntry[]
  /** Section ids to flag as conflicting (rendered red). */
  conflicts?: Set<string>
  /** Smaller layout for side-by-side compare. */
  compact?: boolean
  /** Click a class block (e.g. to swap sections). */
  onEventClick?: (entry: TimetableEntry) => void
  /** Section id to highlight as selected. */
  selectedId?: string
}

export default function WeekCalendar({
  entries,
  conflicts,
  compact = false,
  onEventClick,
  selectedId,
}: Props) {
  const pxPerMin = compact ? 0.5 : 0.9
  const height = (END - START) * pxPerMin

  const events = useMemo(() => {
    const colorByCode = new Map<string, Color>()
    const out: {
      key: string
      entry: TimetableEntry
      code: string
      type: string
      day: number
      start: number
      end: number
      location: string
      color: Color
      conflict: boolean
    }[] = []
    for (const e of entries) {
      if (!colorByCode.has(e.code)) {
        colorByCode.set(e.code, PALETTE[colorByCode.size % PALETTE.length])
      }
      const color = colorByCode.get(e.code)!
      const conflict = conflicts?.has(e.sectionId) ?? false
      for (const m of e.meetings) {
        out.push({
          key: `${e.sectionId}-${m.day}-${m.start}`,
          entry: e,
          code: e.code,
          type: e.type,
          day: m.day,
          start: m.start,
          end: m.end,
          location: m.location,
          color,
          conflict,
        })
      }
    }
    return out
  }, [entries, conflicts])

  const labelSize = compact ? "text-[9px]" : "text-[11px]"

  return (
    <div>
      <div className="mb-2 grid grid-cols-[40px_repeat(5,1fr)]">
        <div />
        {DAY_LABELS.map((d) => (
          <div key={d} className="px-1 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[40px_repeat(5,1fr)]" style={{ height }}>
        <div className="relative">
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute right-1 -translate-y-1/2 text-[9px] text-zinc-600"
              style={{ top: (h * 60 - START) * pxPerMin }}
            >
              {formatTime(h * 60)}
            </div>
          ))}
        </div>

        {DAY_LABELS.map((_, dayIndex) => (
          <div key={dayIndex} className="relative border-l border-white/[0.05]">
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-white/[0.04]"
                style={{ top: (h * 60 - START) * pxPerMin }}
              />
            ))}

            {events
              .filter((e) => e.day === dayIndex)
              .map((e) => {
                const top = (e.start - START) * pxPerMin
                const h = (e.end - e.start) * pxPerMin
                const selected = selectedId === e.entry.sectionId
                return (
                  <div
                    key={e.key}
                    onClick={onEventClick ? () => onEventClick(e.entry) : undefined}
                    role={onEventClick ? "button" : undefined}
                    tabIndex={onEventClick ? 0 : undefined}
                    onKeyDown={
                      onEventClick
                        ? (ev) => {
                            if (ev.key === "Enter" || ev.key === " ") {
                              ev.preventDefault()
                              onEventClick(e.entry)
                            }
                          }
                        : undefined
                    }
                    className={`absolute left-0.5 right-0.5 overflow-hidden rounded-md border px-1 py-0.5 backdrop-blur-sm ${
                      onEventClick ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70" : ""
                    } ${e.conflict ? "ring-2 ring-red-500/70" : selected ? "ring-2 ring-yellow-400/80" : ""}`}
                    style={{
                      top,
                      height: h,
                      backgroundColor: e.conflict ? "rgba(248,113,113,0.16)" : e.color.bg,
                      borderColor: e.conflict ? "rgba(248,113,113,0.7)" : e.color.border,
                    }}
                    title={`${e.code} · ${e.location}`}
                  >
                    <p className={`truncate font-bold ${labelSize}`} style={{ color: e.conflict ? "#fecaca" : e.color.text }}>
                      {e.code}
                    </p>
                    {!compact && (
                      <p className="truncate text-[9px] text-zinc-400">
                        {e.type} · {e.location}
                      </p>
                    )}
                  </div>
                )
              })}
          </div>
        ))}
      </div>
    </div>
  )
}
