import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { labelText } from "../lib/ui"

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
  return (
    <div className="space-y-1.5">
      <label className={labelText}>{label}</label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")} disabled={disabled}>
        <SelectTrigger className="h-auto w-full rounded-[var(--radius-input)] border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm text-bone data-placeholder:text-ash">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="glass-pop rounded-[var(--radius-input)]">
          {options.map((opt) => (
            <SelectItem key={opt} value={opt} className="text-sm text-mist data-highlighted:bg-white/[0.06] data-highlighted:text-gold">
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
