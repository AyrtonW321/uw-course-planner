import { useEffect, useRef, useState } from "react"

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
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  return (
    <div className="space-y-1.5" ref={ref}>
      <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400">
        {label}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
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
        <div className="glass-pop mt-2 overflow-hidden rounded-xl">
          {/* Fixed height: 6 rows-ish. Scroll if more */}
          <div className="max-h-52 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt)
                  setOpen(false)
                }}
                className={`block w-full px-4 py-2 text-left text-sm transition hover:bg-white/[0.06] ${
                  opt === value ? "bg-white/[0.06] text-yellow-400" : "text-zinc-300"
                }`}
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
  )
}
