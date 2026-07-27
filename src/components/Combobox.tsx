import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command"
import { cn, labelText } from "../lib/ui"

export type ComboOption = { value: string; label: string }

type ComboboxProps = {
  label?: string
  value: string
  options: ComboOption[]
  placeholder?: string
  onChange: (value: string) => void
}

/** Typeable select: click to open, filter by typing, pick from the list. */
export default function Combobox({
  label,
  value,
  options,
  placeholder = "Type to search…",
  onChange,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <div className="space-y-1.5">
      {label && <label className={labelText}>{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className="flex w-full items-center justify-between rounded-[var(--radius-input)] border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-left text-sm text-bone outline-none focus-visible:border-gold/60 focus-visible:ring-2 focus-visible:ring-gold/15"
        >
          {selected ? (
            <span>
              <span className="font-mono font-semibold">{selected.value}</span>
              {selected.label !== selected.value && (
                <span className="ml-2 text-ash">{selected.label}</span>
              )}
            </span>
          ) : (
            <span className="text-ash">{placeholder}</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 text-ash" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="glass-pop w-[--anchor-width] rounded-[var(--radius-input)] p-0"
        >
          <Command>
            <CommandInput placeholder={placeholder} />
            <CommandList>
              <CommandEmpty>No matches.</CommandEmpty>
              <CommandGroup>
                {options.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={`${o.value} ${o.label}`}
                    onSelect={() => {
                      onChange(o.value)
                      setOpen(false)
                    }}
                    className="data-selected:bg-white/[0.06]"
                  >
                    <Check className={cn("size-4", o.value === value ? "opacity-100 text-gold" : "opacity-0")} />
                    <span className="font-mono font-semibold">{o.value}</span>
                    {o.label !== o.value && <span className="ml-1 text-ash">{o.label}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
