import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { getTermInfo, listAllCourses } from "../lib/catalog"
import type { Course } from "../lib/courses"
import { glassInput } from "../lib/ui"

type Props = {
  placeholder?: string
  onPick: (course: { code: string; name: string }) => void
}

/**
 * Type-ahead course picker. Loads the whole-term catalog once and shows
 * matching courses in a dropdown. The menu is rendered in a portal with fixed
 * positioning so it never gets clipped by, or paint under, sibling cards.
 */
export default function CourseSearch({ placeholder = "Add course…", onPick }: Props) {
  const [all, setAll] = useState<Course[]>([])
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const listboxId = useId()

  useEffect(() => {
    let alive = true
    getTermInfo()
      .then((t) => listAllCourses(t.termCode))
      .then((cs) => alive && setAll(cs))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return all
      .filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      .slice(0, 20)
  }, [query, all])

  const updateRect = () => {
    if (inputRef.current) setRect(inputRef.current.getBoundingClientRect())
  }

  useLayoutEffect(() => {
    if (open) updateRect()
  }, [open, matches.length])

  // Reposition on scroll/resize while open; close on outside click.
  useEffect(() => {
    if (!open) return
    const onMove = () => updateRect()
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (inputRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    window.addEventListener("scroll", onMove, true)
    window.addEventListener("resize", onMove)
    document.addEventListener("mousedown", onDown)
    return () => {
      window.removeEventListener("scroll", onMove, true)
      window.removeEventListener("resize", onMove)
      document.removeEventListener("mousedown", onDown)
    }
  }, [open])

  const pick = (c: Course) => {
    onPick({ code: c.code, name: c.name })
    setQuery("")
    setOpen(false)
  }

  const showMenu = open && matches.length > 0 && rect

  return (
    <>
      <input
        ref={inputRef}
        aria-label={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[active] ? `${listboxId}-${active}` : undefined}
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

      {showMenu &&
        createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            style={{
              position: "fixed",
              top: rect!.bottom + 4,
              left: rect!.left,
              width: rect!.width,
            }}
            className="glass-pop z-[100] max-h-56 overflow-y-auto rounded-xl"
          >
            {matches.map((c, i) => (
              <button
                key={c.code}
                id={`${listboxId}-${i}`}
                role="option"
                aria-selected={i === active}
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
          </div>,
          document.body
        )}
    </>
  )
}
