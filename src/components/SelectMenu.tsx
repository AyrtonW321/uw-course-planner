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
    <div className="space-y-1" ref={ref}>
      <label className="block text-sm text-slate-200">{label}</label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-left text-white outline-none focus:border-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <div className="flex items-center justify-between">
          <span className={value ? "text-white" : "text-slate-400"}>
            {value || placeholder}
          </span>
          <span className="text-slate-400">▾</span>
        </div>
      </button>

      {open && !disabled && (
        <div className="mt-2 rounded-lg border border-slate-700 bg-slate-900 shadow-lg overflow-hidden">
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
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-800 ${
                  opt === value ? "bg-slate-800 text-white" : "text-slate-200"
                }`}
              >
                {opt}
              </button>
            ))}
            {options.length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-400">
                No options
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
