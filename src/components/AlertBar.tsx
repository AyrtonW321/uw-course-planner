import { useState } from "react"
import { Link } from "react-router-dom"
import { useAlerts, type AlertKind } from "../lib/alerts"

const KIND_STYLE: Record<AlertKind, string> = {
  "missing-grade": "text-amber-300",
  failed: "text-red-400",
  "prereq-grade": "text-orange-300",
}

const KIND_DOT: Record<AlertKind, string> = {
  "missing-grade": "bg-amber-400",
  failed: "bg-red-500",
  "prereq-grade": "bg-orange-400",
}

export default function AlertBar() {
  const alerts = useAlerts()
  const [open, setOpen] = useState(false)

  if (alerts.length === 0) return null

  const hasFailure = alerts.some((a) => a.kind === "failed")

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <div
        className={`glass rounded-2xl border ${
          hasFailure ? "border-red-500/30" : "border-amber-500/25"
        }`}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="alert-bar-list"
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
        >
          <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${hasFailure ? "bg-red-500" : "bg-amber-400"}`} />
          <span className="text-sm font-semibold text-white">
            {alerts.length} thing{alerts.length === 1 ? "" : "s"} need your attention
          </span>
          <span className="ml-auto text-xs text-zinc-500">{open ? "Hide" : "Show"}</span>
        </button>

        {open && (
          <ul id="alert-bar-list" className="divide-y divide-white/[0.05] border-t border-white/[0.06]">
            {alerts.map((a) => (
              <li key={a.id}>
                <Link
                  to={a.to}
                  className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-white/[0.04]"
                >
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${KIND_DOT[a.kind]}`} />
                  <span className="min-w-0">
                    <span className={`text-sm font-medium ${KIND_STYLE[a.kind]}`}>{a.title}</span>
                    <span className="ml-2 text-sm text-zinc-400">{a.detail}</span>
                  </span>
                  <span className="ml-auto flex-shrink-0 text-xs text-zinc-600">Fix →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
