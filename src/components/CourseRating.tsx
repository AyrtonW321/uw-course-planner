import type { FlowRating } from "../lib/uwflow"

const pct = (v: number | null) => (v == null ? "—" : `${Math.round(v * 100)}%`)

const flowUrl = (code: string) =>
  `https://uwflow.com/course/${code.toLowerCase().replace(/\s+/g, "")}`

/** Compact one-line rating summary for cards/lists. */
export function RatingBadges({ rating }: { rating: FlowRating | null }) {
  if (!rating || rating.filled === 0) {
    return <span className="text-[11px] text-zinc-600">No UW Flow ratings</span>
  }
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
      <span className="text-green-400">👍 {pct(rating.liked)} liked</span>
      <span className="text-sky-400">useful {pct(rating.useful)}</span>
      <span className="text-yellow-400">easy {pct(rating.easy)}</span>
      <span className="text-zinc-600">· {rating.filled} ratings</span>
    </span>
  )
}

function Bar({ label, value, color }: { label: string; value: number | null; color: string }) {
  const w = value == null ? 0 : Math.round(value * 100)
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-500">{pct(value)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${w}%` }} />
      </div>
    </div>
  )
}

/** Full ratings card for the course detail page. */
export function RatingCard({ code, rating }: { code: string; rating: FlowRating | null }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">UW Flow Ratings</h2>
        <a
          href={flowUrl(code)}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-yellow-400 hover:text-yellow-300"
        >
          View on UW Flow ↗
        </a>
      </div>

      {!rating || rating.filled === 0 ? (
        <p className="text-sm text-zinc-500">No ratings yet for this course.</p>
      ) : (
        <>
          <div className="space-y-3">
            <Bar label="Liked" value={rating.liked} color="bg-green-400" />
            <Bar label="Useful" value={rating.useful} color="bg-sky-400" />
            <Bar label="Easy" value={rating.easy} color="bg-yellow-400" />
          </div>
          <p className="mt-4 text-xs text-zinc-600">
            {rating.filled} ratings · {rating.comments} reviews on UW Flow
          </p>
        </>
      )}
    </div>
  )
}
