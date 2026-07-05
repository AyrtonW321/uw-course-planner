import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useTimetable, type TimetableEntry } from "../lib/timetable"
import { ALL_TERM_IDS } from "../lib/degreePlan"
import { useProfileMeta } from "../lib/profile"
import { useSchedules } from "../lib/schedules"
import { findConflicts, entriesConflict, conflictFreeCombos, type ChosenSection } from "../lib/conflicts"
import { buildICS, downloadICS } from "../lib/ics"
import { getCourseWithSections, getTermInfo } from "../lib/catalog"
import { parseQuestSchedule, matchSections, type ParsedMeeting } from "../lib/questImport"
import { DAY_LABELS, formatTime, type Section } from "../lib/courses"
import { useCourseRatings } from "../lib/uwflow"
import SelectMenu from "../components/SelectMenu"
import WeekCalendar from "../components/WeekCalendar"
import { glassCard, goldButton, glassButton, glassInput } from "../lib/ui"

// "Mon/Wed 12:30pm–1:20pm" — meetings grouped by shared time.
function fmtMeetings(meetings: { day: number; start: number; end: number }[]): string {
  const groups = new Map<string, number[]>()
  for (const m of meetings) {
    const k = `${m.start}-${m.end}`
    const arr = groups.get(k) ?? []
    arr.push(m.day)
    groups.set(k, arr)
  }
  return [...groups.entries()]
    .map(([k, days]) => {
      const [s, e] = k.split("-").map(Number)
      return `${days.map((d) => DAY_LABELS[d]).join("/")} ${formatTime(s)}–${formatTime(e)}`
    })
    .join(", ")
}

function sectionToEntry(
  s: Section,
  code: string,
  title: string,
  termCode: string,
  term: string
): TimetableEntry {
  return {
    sectionId: s.id,
    code,
    title,
    type: s.type,
    section: s.section,
    termCode,
    term,
    instructor: s.instructor,
    meetings: s.meetings,
  }
}

type SwapState = { entry: TimetableEntry; sections: Section[]; title: string; termCode: string }

export default function TimetablePage() {
  const { entries, loading, persist } = useTimetable()
  const { meta, loading: profileLoading } = useProfileMeta()
  const { schedules, save: saveSchedule, remove: removeSchedule } = useSchedules()

  const [term, setTerm] = useState("1A")
  const inited = useRef(false)
  const [saveName, setSaveName] = useState("")
  const [showSave, setShowSave] = useState(false)
  const [compareId, setCompareId] = useState("")
  const [suggesting, setSuggesting] = useState(false)
  const [suggestions, setSuggestions] = useState<ChosenSection[][] | null>(null)
  const [suggestTermCode, setSuggestTermCode] = useState("")

  // Import
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState("")
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<TimetableEntry[] | null>(null)

  // Swap
  const [swap, setSwap] = useState<SwapState | null>(null)
  const [swapLoading, setSwapLoading] = useState(false)

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
  const conflicts = useMemo(() => findConflicts(termEntries), [termEntries])
  const courseCodes = useMemo(() => [...new Set(termEntries.map((e) => e.code))], [termEntries])
  const ratings = useCourseRatings(courseCodes)

  const totalHours = useMemo(() => {
    let m = 0
    for (const e of termEntries) for (const mt of e.meetings) m += mt.end - mt.start
    return m / 60
  }, [termEntries])

  const applyToTerm = (list: TimetableEntry[]) => {
    const others = entries.filter((e) => (e.term ?? "1A") !== term)
    persist([...others, ...list.map((e) => ({ ...e, term }))])
  }
  const removeEntry = (sectionId: string) =>
    persist(entries.filter((e) => e.sectionId !== sectionId))

  const onExport = () => {
    if (termEntries.length === 0) return
    downloadICS(`uw-timetable-${term}.ics`, buildICS(termEntries, `UW ${term}`))
  }

  const onSave = () => {
    saveSchedule(saveName, term, termEntries)
    setSaveName("")
    setShowSave(false)
  }

  // --- Quest import ---
  const runImport = async () => {
    setImporting(true)
    setImportResult(null)
    try {
      const parsed = parseQuestSchedule(importText)
      const byCode = new Map<string, ParsedMeeting[]>()
      for (const p of parsed) {
        const a = byCode.get(p.code) ?? []
        a.push(p)
        byCode.set(p.code, a)
      }
      const t = await getTermInfo()
      const built: TimetableEntry[] = []
      for (const [code, meetings] of byCode) {
        const course = await getCourseWithSections(t.termCode, code)
        const matched = course ? matchSections(course.sections, meetings) : []
        if (matched.length) {
          for (const s of matched) built.push(sectionToEntry(s, code, course!.name, t.termCode, term))
        } else {
          // Fallback: render exactly what was pasted.
          built.push({
            sectionId: `quest-${code}`,
            code,
            title: course?.name ?? code,
            type: "LEC",
            section: "—",
            termCode: t.termCode,
            term,
            instructor: "",
            meetings: meetings.map((m) => ({ day: m.day, start: m.start, end: m.end, location: "UW" })),
          })
        }
      }
      setImportResult(built)
    } finally {
      setImporting(false)
    }
  }

  const confirmImport = () => {
    if (!importResult) return
    const others = entries.filter((e) => (e.term ?? "1A") !== term)
    const map = new Map(termEntries.map((e) => [e.sectionId, e]))
    for (const e of importResult) map.set(e.sectionId, { ...e, term })
    persist([...others, ...map.values()])
    setImportResult(null)
    setImportText("")
    setShowImport(false)
  }

  // --- Suggest conflict-free ---
  const onSuggest = async () => {
    setSuggesting(true)
    setSuggestions(null)
    try {
      const t = await getTermInfo()
      setSuggestTermCode(t.termCode)
      const opts = []
      for (const code of courseCodes) {
        const course = await getCourseWithSections(t.termCode, code)
        if (course && course.sections.length) {
          opts.push({ code: course.code, title: course.name, sections: course.sections })
        }
      }
      setSuggestions(conflictFreeCombos(opts, 3))
    } finally {
      setSuggesting(false)
    }
  }
  const applySuggestion = (combo: ChosenSection[]) => {
    applyToTerm(combo.map((c) => sectionToEntry(c.section, c.code, c.title, suggestTermCode, term)))
    setSuggestions(null)
  }

  // --- Swap ---
  const openSwap = async (entry: TimetableEntry) => {
    setSwapLoading(true)
    setSwap(null)
    try {
      const t = await getTermInfo()
      const course = await getCourseWithSections(t.termCode, entry.code)
      const sections = (course?.sections ?? []).filter((s) => s.type === entry.type)
      setSwap({ entry, sections, title: course?.name ?? entry.title, termCode: t.termCode })
    } finally {
      setSwapLoading(false)
    }
  }
  const swapFeasible = (s: Section) => {
    if (!swap) return false
    const cand = sectionToEntry(s, swap.entry.code, swap.title, swap.termCode, term)
    return !termEntries.some((o) => o.sectionId !== swap.entry.sectionId && entriesConflict(cand, o))
  }
  const applySwap = (s: Section) => {
    if (!swap) return
    const cand = sectionToEntry(s, swap.entry.code, swap.title, swap.termCode, term)
    const others = entries.filter((e) => e.sectionId !== swap.entry.sectionId)
    persist([...others, cand])
    setSwap(null)
  }

  const compareSchedule = schedules.find((s) => s.id === compareId)

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-zinc-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-yellow-400" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header + toolbar */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Your Timetable</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {totalHours > 0 ? `${totalHours.toFixed(1)} hours of class in ${term}` : `No courses in ${term}`}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-20">
            <SelectMenu label="Term" value={term} options={[...ALL_TERM_IDS]} onChange={setTerm} />
          </div>
          <button onClick={() => setShowImport((v) => !v)} className={`${glassButton} px-3 py-2.5 text-sm font-medium`}>
            Import
          </button>
          <button onClick={onExport} disabled={termEntries.length === 0} className={`${glassButton} px-3 py-2.5 text-sm font-medium`}>
            Export .ics
          </button>
          <button onClick={() => setShowSave((v) => !v)} disabled={termEntries.length === 0} className={`${glassButton} px-3 py-2.5 text-sm font-medium`}>
            Save
          </button>
          <button onClick={onSuggest} disabled={courseCodes.length === 0 || suggesting} className={`${glassButton} px-3 py-2.5 text-sm font-medium`}>
            {suggesting ? "Finding…" : "Suggest fix"}
          </button>
          <Link to="/app/courses" className={`${goldButton} px-4 py-2.5 text-sm`}>+ Add</Link>
        </div>
      </div>

      {/* Import panel */}
      {showImport && (
        <div className={`${glassCard} space-y-3 p-5`}>
          <div>
            <h2 className="text-sm font-semibold text-white">Import from Quest</h2>
            <p className="mt-1 text-xs text-zinc-500">
              In Quest open <span className="text-zinc-300">Class Schedule</span>, select all (Ctrl+A) and copy
              (Ctrl+C), then paste below. We'll match your sections to the live catalog.
            </p>
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={5}
            placeholder="Paste your Quest class schedule here…"
            className={`${glassInput} font-mono`}
          />
          <div className="flex gap-2">
            <button onClick={runImport} disabled={!importText.trim() || importing} className={`${glassButton} px-4 py-2 text-sm font-medium`}>
              {importing ? "Matching…" : "Match courses"}
            </button>
            {importResult && importResult.length > 0 && (
              <button onClick={confirmImport} className={`${goldButton} px-4 py-2 text-sm`}>
                Add {importResult.length} section{importResult.length === 1 ? "" : "s"} to {term}
              </button>
            )}
          </div>
          {importResult && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              {importResult.length === 0 ? (
                <p className="text-sm text-zinc-500">No classes detected. Make sure you copied the schedule table.</p>
              ) : (
                <ul className="space-y-1">
                  {importResult.map((e) => (
                    <li key={e.sectionId} className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-yellow-400">{e.code}</span>
                      <span className="text-zinc-400">{e.type} {e.section}</span>
                      <span className="truncate text-zinc-600">{fmtMeetings(e.meetings)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Save name row */}
      {showSave && (
        <div className={`${glassCard} flex flex-wrap items-center gap-2 p-3`}>
          <input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder={`Name this ${term} schedule`}
            className={`${glassInput} min-w-[200px] flex-1`}
          />
          <button onClick={onSave} className={`${goldButton} px-4 py-2 text-sm`}>Save snapshot</button>
        </div>
      )}

      {/* Conflict banner */}
      {conflicts.pairs.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <p className="font-semibold">{conflicts.pairs.length} time conflict{conflicts.pairs.length === 1 ? "" : "s"}</p>
          <ul className="mt-1 space-y-0.5 text-xs text-red-300/90">
            {conflicts.pairs.map((p, i) => (
              <li key={i}>{p.a.code} {p.a.section} overlaps {p.b.code} {p.b.section}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {suggestions && (
        <div className={`${glassCard} p-4`}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Conflict-free suggestions</h2>
            <button onClick={() => setSuggestions(null)} className="text-xs text-zinc-500 hover:text-white">Dismiss</button>
          </div>
          {suggestions.length === 0 ? (
            <p className="text-sm text-zinc-500">No conflict-free combination found for these courses.</p>
          ) : (
            <div className="space-y-2">
              {suggestions.map((combo, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="flex flex-1 flex-wrap gap-1.5">
                    {combo.map((c) => (
                      <span key={c.section.id} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px]">
                        <span className="font-mono font-bold text-yellow-400">{c.code}</span>{" "}
                        <span className="text-zinc-400">{c.section.type} {c.section.section}</span>
                      </span>
                    ))}
                  </div>
                  <button onClick={() => applySuggestion(combo)} className={`${goldButton} px-3 py-1.5 text-xs`}>Apply</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compare mode */}
      {compareSchedule ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className={`${glassCard} p-4`}>
            <p className="mb-2 text-sm font-semibold text-white">Current — {term}</p>
            <WeekCalendar entries={termEntries} conflicts={conflicts.sectionIds} compact />
          </div>
          <div className={`${glassCard} p-4`}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{compareSchedule.name}</p>
              <button onClick={() => setCompareId("")} className="text-xs text-zinc-500 hover:text-white">Close</button>
            </div>
            <WeekCalendar entries={compareSchedule.entries} compact />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px] lg:items-start">
          <div className={`${glassCard} overflow-hidden p-4`}>
            <p className="mb-2 text-[11px] text-zinc-600">Click a class to swap sections.</p>
            <WeekCalendar
              entries={termEntries}
              conflicts={conflicts.sectionIds}
              onEventClick={openSwap}
              selectedId={swap?.entry.sectionId}
            />
          </div>

          <div className="space-y-4">
            {/* Swap panel takes over the sidebar when active */}
            {swap ? (
              <div className={`${glassCard} p-5`}>
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">
                    Swap {swap.entry.code} {swap.entry.type}
                  </h2>
                  <button onClick={() => setSwap(null)} className="text-xs text-zinc-500 hover:text-white">Close</button>
                </div>
                <p className="mb-3 text-xs text-zinc-500">Pick a section — you make the change in Quest.</p>
                {swapLoading ? (
                  <div className="py-6 text-center text-zinc-500">Loading sections…</div>
                ) : swap.sections.length === 0 ? (
                  <p className="text-sm text-zinc-500">No other sections available.</p>
                ) : (
                  <ul className="space-y-2">
                    {swap.sections.map((s) => {
                      const enrolled = s.id === swap.entry.sectionId
                      const ok = swapFeasible(s)
                      const full = s.capacity > 0 && s.enrolled >= s.capacity
                      return (
                        <li key={s.id} className={`rounded-lg border p-3 ${enrolled ? "border-yellow-500/50 bg-yellow-500/5" : "border-white/[0.06] bg-white/[0.02]"}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-white">{s.type} {s.section}</span>
                            {enrolled ? (
                              <span className="text-[11px] text-yellow-400">Enrolled</span>
                            ) : ok ? (
                              <button onClick={() => applySwap(s)} className={`${goldButton} px-3 py-1 text-xs`}>Swap</button>
                            ) : (
                              <span className="text-[11px] text-red-400">Conflicts</span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">
                            {s.meetings.length ? fmtMeetings(s.meetings) : "Online / no fixed time"}
                          </p>
                          {s.capacity > 0 && (
                            <p className="mt-0.5 text-[11px] text-zinc-600">
                              {s.enrolled}/{s.capacity} filled{full && <span className="ml-1 text-red-400">· Full</span>}
                            </p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            ) : (
              <div className={`${glassCard} p-5`}>
                <h2 className="mb-3 text-sm font-semibold text-white">Your Courses</h2>
                {termEntries.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    Nothing here yet.{" "}
                    <Link to="/app/courses" className="text-yellow-400 hover:text-yellow-300">Browse courses</Link>.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {termEntries.map((e) => {
                      const r = ratings.get(e.code)
                      return (
                        <li key={e.sectionId} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openSwap(e)} className="min-w-0 flex-1 text-left">
                              <p className="font-mono text-xs font-bold text-white">
                                {e.code} <span className="text-zinc-500">{e.type} {e.section}</span>
                              </p>
                              <p className="truncate text-[11px] text-zinc-500">{e.title}</p>
                            </button>
                            <button onClick={() => removeEntry(e.sectionId)} className="flex-shrink-0 text-xs text-zinc-600 transition hover:text-red-400" aria-label={`Remove ${e.code}`}>✕</button>
                          </div>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            {e.meetings.length ? fmtMeetings(e.meetings) : "Online"}
                            {e.meetings[0]?.location ? ` · ${e.meetings[0].location}` : ""}
                          </p>
                          {r && r.filled > 0 && (
                            <p className="mt-0.5 text-[11px] text-green-400/80">
                              👍 {Math.round((r.liked ?? 0) * 100)}% liked · {r.filled} ratings
                            </p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* Saved schedules */}
            {schedules.length > 0 && (
              <div className={`${glassCard} p-5`}>
                <h2 className="mb-3 text-sm font-semibold text-white">Saved Schedules</h2>
                <ul className="space-y-2">
                  {schedules.map((s) => (
                    <li key={s.id} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white">{s.name}</p>
                        <p className="text-[10px] text-zinc-500">{s.term} · {s.entries.length} sections</p>
                      </div>
                      <button onClick={() => applyToTerm(s.entries)} className="text-[11px] text-yellow-400 hover:text-yellow-300">Load</button>
                      <button onClick={() => setCompareId(s.id)} className="text-[11px] text-zinc-400 hover:text-white">Compare</button>
                      <button onClick={() => removeSchedule(s.id)} className="text-xs text-zinc-600 hover:text-red-400" aria-label="Delete">✕</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
