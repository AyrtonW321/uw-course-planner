import { useEffect, useMemo, useState } from "react"
import { getTermInfo, listAllCourses } from "../lib/catalog"
import type { Course } from "../lib/courses"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "./ui/command"

type Props = {
  placeholder?: string
  onPick: (course: { code: string; name: string }) => void
}

/**
 * Type-ahead course picker. Loads the whole-term catalog once and shows
 * matching courses in a dropdown anchored to the input.
 */
export default function CourseSearch({ placeholder = "Add course…", onPick }: Props) {
  const [all, setAll] = useState<Course[]>([])
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)

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

  const pick = (c: Course) => {
    onPick({ code: c.code, name: c.name })
    setQuery("")
    setOpen(false)
  }

  return (
    <Popover open={open && matches.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <input
            aria-label={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false)
            }}
            placeholder={placeholder}
            className="w-full rounded-[var(--radius-input)] border border-white/[0.1] bg-white/[0.04] px-4 py-1.5 text-xs text-bone outline-none placeholder:text-ash focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
          />
        }
      />
      <PopoverContent
        align="start"
        className="glass-pop w-[--anchor-width] rounded-[var(--radius-input)] p-0"
      >
        <Command shouldFilter={false}>
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandGroup>
              {matches.map((c) => (
                <CommandItem
                  key={c.code}
                  value={c.code}
                  onSelect={() => pick(c)}
                  className="data-selected:bg-white/[0.06]"
                >
                  <span className="font-mono font-bold text-gold">{c.code}</span>
                  <span className="ml-2 text-ash">{c.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
