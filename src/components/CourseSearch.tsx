import { useEffect, useMemo, useRef, useState } from "react"
import { getTermInfo, listAllCourses } from "../lib/catalog"
import type { Course } from "../lib/courses"
import { glassInput } from "../lib/ui"

type Props = {
  placeholder?: string
  onPick: (course: { code: string; name: string }) => void
}

/**
 * Type-ahead course picker. Loads the whole-term catalog once and shows
 * matching courses in a dropdown; clicking one calls `onPick`.
 */
export default function CourseSearch({ placeholder = "Add course…", onPick }: Props) {
  const [all, setAll] = useState<Course[]>([])
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let active = true
    getTermInfo()
      .then((t) => listAllCourses(t.termCode))
      .then((cs) => active && setAll(cs))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return all
      .filter(
        (c) =>
          c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
      )
      .slice(0, 20)
  }, [query, all])

  const pick = (c: Course) => {
    onPick({ code: c.code, name: c.name })
    setQuery("")
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setActive((a) => Math.min(a + 1, matches.length - 1))
          } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setActive((a) => Math.max(a - 1, 0))
          } else if (e.key === "Enter" && matches[active]) {
            e.preventDefault()
            pick(matches[active])
          } else if (e.key === "Escape") {
            setOpen(false)
          }
        }}
        placeholder={placeholder}
        className={`${glassInput} py-1.5 text-xs`}
      />

      {open && matches.length > 0 && (
        <div className="absolute z-30 mt-1.5 max-h-56 w-full overflow-y-auto rounded-lg border border-white/[0.08] bg-zinc-950/95 shadow-2xl backdrop-blur-xl">
          {matches.map((c, i) => (
            <button
              key={c.code}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(c)}
              className={`block w-full px-3 py-2 text-left text-xs transition ${
                i === active ? "bg-white/[0.06]" : ""
              }`}
            >
              <span className="font-mono font-bold text-yellow-400">{c.code}</span>
              <span className="ml-2 text-zinc-400">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
