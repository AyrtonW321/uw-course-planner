import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

type Props = {
  codes: string[]
}

/** Small "→N" badge that opens a list of the courses this one leads to. */
export default function LeadsToPopover({ codes }: Props) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        title="Courses this leads to"
        aria-label={`Courses this leads to (${codes.length})`}
        className={`flex-shrink-0 rounded-full border px-1.5 text-[10px] transition ${
          open
            ? "border-gold/40 bg-gold/10 text-gold"
            : "border-white/[0.08] bg-white/[0.03] text-ash hover:border-gold/30 hover:text-gold"
        }`}
      >
        →{codes.length}
      </PopoverTrigger>
      <PopoverContent align="start" className="glass-pop w-auto min-w-[8rem] rounded-[var(--radius-input)] p-0">
        <p className="border-b border-white/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-ash">
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
            className="block w-full px-3 py-1.5 text-left font-mono text-xs font-bold text-gold transition hover:bg-white/[0.06]"
          >
            {c}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
