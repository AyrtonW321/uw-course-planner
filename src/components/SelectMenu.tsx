import { useEffect, useId, useRef, useState } from "react"

type SelectMenuProps = {
  label: string
  value: string
  options: string[]
  placeholder?: string
  disabled?: boolean
  onChange: (value: string) => void
}

export default function SelectMenu({
  label,
  value,
  options,
  placeholder = "Select...",
  disabled = false,
  onChange,
}: SelectMenuProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement | null>(null)
  const listboxId = useId()

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  useEffect(() => {
    if (open) setActive(Math.max(0, options.indexOf(value)))
  }, [open, value, options])

  return (
    <div className="space-y-1.5" ref={ref}>
      <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400">
        {label}
      </label>

      {/* Relative wrapper so the menu overlays instead of pushing the layout. */}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open && options[active] ? `${listboxId}-${active}` : undefined}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
              setActive((a) => Math.min(a + 1, options.length - 1))
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              setOpen(true)
              setActive((a) => Math.max(a - 1, 0))
            } else if (e.key === "Enter" || e.key === " ") {
              if (open && options[active]) {
                e.preventDefault()
                onChange(options[active])
                setOpen(false)
              }
            } else if (e.key === "Escape") {
              setOpen(false)
            }
          }}
          className="glass-input w-full rounded-xl px-4 py-2.5 text-left text-sm text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-between">
            <span className={value ? "text-white" : "text-zinc-600"}>
              {value || placeholder}
            </span>
            <span className="text-zinc-500">▾</span>
          </div>
        </button>

        {open && !disabled && (
          <div id={listboxId} role="listbox" className="glass-pop absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl">
            {/* Fixed height: 6 rows-ish. Scroll if more */}
            <div className="max-h-52 overflow-y-auto">
              {options.map((opt, i) => (
                <button
                  key={opt}
                  id={`${listboxId}-${i}`}
                  role="option"
                  aria-selected={opt === value}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    onChange(opt)
                    setOpen(false)
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm transition hover:bg-white/[0.06] ${
                    i === active ? "bg-white/[0.06]" : ""
                  } ${opt === value ? "text-yellow-400" : "text-zinc-300"}`}
                >
                  {opt}
                </button>
              ))}
              {options.length === 0 && (
                <div className="px-4 py-2 text-sm text-zinc-500">No options</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
