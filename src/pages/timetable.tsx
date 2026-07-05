import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useTimetable, type TimetableEntry } from "../lib/timetable"
import { ALL_TERM_IDS } from "../lib/degreePlan"
import { useProfileMeta } from "../lib/profile"
import { useSchedules } from "../lib/schedules"
import { findConflicts, conflictFreeCombos, type ChosenSection } from "../lib/conflicts"
import { buildICS, downloadICS } from "../lib/ics"
import { getCourseWithSections, getTermInfo } from "../lib/catalog"
import SelectMenu from "../components/SelectMenu"
import WeekCalendar from "../components/WeekCalendar"
import { glassCard, goldButton, glassButton } from "../lib/ui"

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

  const totalHours = useMemo(() => {
    let m = 0
    for (const e of termEntries) for (const mt of e.meetings) m += mt.end - mt.start
    return m / 60
  }, [termEntries])

  const courses = useMemo(() => {
    const seen = new Map<string, string>()
    for (const e of termEntries) if (!seen.has(e.code)) seen.set(e.code, e.title)
    return [...seen.entries()].map(([code, title]) => ({ code, title }))
  }, [termEntries])

  // Replace all of the current term's entries.
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

  const onSuggest = async () => {
    setSuggesting(true)
    setSuggestions(null)
    try {
      const t = await getTermInfo()
      setSuggestTermCode(t.termCode)
      const opts = []
      for (const c of courses) {
        const course = await getCourseWithSections(t.termCode, c.code)
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
    const list: TimetableEntry[] = combo.map((c) => ({
      sectionId: c.section.id,
      code: c.code,
      title: c.title,
      type: c.section.type,
      section: c.section.section,
      termCode: suggestTermCode,
      term,
      instructor: c.section.instructor,
      meetings: c.section.meetings,
    }))
    applyToTerm(list)
    setSuggestions(null)
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
          <button onClick={onExport} disabled={termEntries.length === 0} className={`${glassButton} px-3 py-2.5 text-sm font-medium`}>
            Export .ics
          </button>
          <button onClick={() => setShowSave((v) => !v)} disabled={termEntries.length === 0} className={`${glassButton} px-3 py-2.5 text-sm font-medium`}>
            Save
          </button>
          <button onClick={onSuggest} disabled={courses.length === 0 || suggesting} className={`${glassButton} px-3 py-2.5 text-sm font-medium`}>
            {suggesting ? "Finding…" : "Suggest fix"}
          </button>
          <Link to="/app/courses" className={`${goldButton} px-4 py-2.5 text-sm`}>
            + Add
          </Link>
        </div>
      </div>

      {/* Save name row */}
      {showSave && (
        <div className={`${glassCard} flex flex-wrap items-center gap-2 p-3`}>
          <input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder={`Name this ${term} schedule`}
            className="glass-input min-w-[200px] flex-1 rounded-lg px-3 py-2 text-sm text-white outline-none"
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
              <li key={i}>
                {p.a.code} {p.a.section} overlaps {p.b.code} {p.b.section}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-red-300/70">Try “Suggest fix” for a conflict-free combination.</p>
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
          <div className={`${glassCard} overflow-hidden p-4`}>
            <WeekCalendar entries={termEntries} conflicts={conflicts.sectionIds} />
          </div>

          <div className="space-y-4">
            <div className={`${glassCard} p-5`}>
              <h2 className="mb-3 text-sm font-semibold text-white">Your Courses</h2>
              {courses.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Nothing here yet.{" "}
                  <Link to="/app/courses" className="text-yellow-400 hover:text-yellow-300">Browse courses</Link>.
                </p>
              ) : (
                <ul className="space-y-2">
                  {termEntries.map((e) => (
                    <li key={e.sectionId} className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs font-bold text-white">
                          {e.code} <span className="text-zinc-500">{e.type} {e.section}</span>
                        </p>
                        <p className="truncate text-[11px] text-zinc-500">{e.title}</p>
                      </div>
                      <button
                        onClick={() => removeEntry(e.sectionId)}
                        className="flex-shrink-0 text-xs text-zinc-600 transition hover:text-red-400"
                        aria-label={`Remove ${e.code}`}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

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
                      <button onClick={() => applyToTerm(s.entries)} className="text-[11px] text-yellow-400 hover:text-yellow-300" title="Load into current term">Load</button>
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
