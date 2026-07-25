import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"

type Props = {
  codes: string[]
}

/**
 * Small "→N" badge that opens a styled dropdown of the courses this one leads
 * to. Click a course to open its details. Rendered in a portal so it floats
 * above sibling cards.
 */
export default function LeadsToPopover({ codes }: Props) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const place = () => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect())
  }

  useLayoutEffect(() => {
    if (open) place()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onMove = () => place()
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("scroll", onMove, true)
    window.addEventListener("resize", onMove)
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("scroll", onMove, true)
      window.removeEventListener("resize", onMove)
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        title="Courses this leads to"
        aria-label={`Courses this leads to (${codes.length})`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex-shrink-0 rounded-full border px-1.5 text-[10px] transition ${
          open
            ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
            : "border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:border-yellow-500/30 hover:text-yellow-300"
        }`}
      >
        →{codes.length}
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: rect.bottom + 4, left: rect.left }}
            className="glass-pop z-[100] min-w-[8rem] overflow-hidden rounded-xl"
          >
            <p className="border-b border-white/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Leads to
            </p>
            {codes.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setOpen(false)
                  navigate(`/app/courses/${encodeURIComponent(c)}`)
                }}
                className="block w-full px-3 py-1.5 text-left font-mono text-xs font-bold text-yellow-400 transition hover:bg-white/[0.06]"
              >
                {c}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}
