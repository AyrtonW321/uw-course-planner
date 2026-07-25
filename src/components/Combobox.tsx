import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react"

export type ComboOption = { value: string; label: string }

type ComboboxProps = {
  label?: string
  value: string
  options: ComboOption[]
  placeholder?: string
  onChange: (value: string) => void
}

/**
 * Typeable select: filter by typing, or pick from the dropdown.
 * Commits a value only when it matches a real option (on click or Enter).
 */
export default function Combobox({
  label,
  value,
  options,
  placeholder = "Type to search…",
  onChange,
}: ComboboxProps) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement | null>(null)
  const listboxId = useId()

  // Keep the input in sync when the value changes from outside. useLayoutEffect
  // (not useEffect) avoids a one-frame flash of the stale query before it catches up.
  useLayoutEffect(() => setQuery(value), [value])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery(value) // revert unconfirmed text
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options.slice(0, 50)
    return options
      .filter(
        (o) =>
          o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q)
      )
      .slice(0, 50)
  }, [query, options])

  const commit = (opt: ComboOption) => {
    onChange(opt.value)
    setQuery(opt.value)
    setOpen(false)
  }

  return (
    <div className="space-y-1.5" ref={ref}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[active] ? `${listboxId}-${active}` : undefined}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActive(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
              setActive((a) => Math.min(a + 1, filtered.length - 1))
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              setActive((a) => Math.max(a - 1, 0))
            } else if (e.key === "Enter") {
              e.preventDefault()
              if (filtered[active]) commit(filtered[active])
            } else if (e.key === "Escape") {
              setOpen(false)
              setQuery(value) // revert unconfirmed text, matching outside-click behavior
            }
          }}
          className="glass-input w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none"
        />

        {open && filtered.length > 0 && (
          <div id={listboxId} role="listbox" className="glass-pop absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-xl">
            {filtered.map((o, i) => (
              <button
                key={o.value}
                id={`${listboxId}-${i}`}
                role="option"
                aria-selected={o.value === value}
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(o)}
                className={`block w-full px-4 py-2 text-left text-sm transition ${
                  i === active ? "bg-white/[0.06]" : ""
                } ${o.value === value ? "text-yellow-400" : "text-zinc-300"}`}
              >
                <span className="font-mono font-semibold">{o.value}</span>
                {o.label !== o.value && (
                  <span className="ml-2 text-zinc-500">{o.label}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
