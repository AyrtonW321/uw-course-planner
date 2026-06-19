import { useEffect, useState } from "react"

/**
 * UW Flow ratings client.
 * -----------------------
 * Reads public course ratings (liked / easy / useful, 0–1) from UW Flow's
 * Hasura GraphQL API. The endpoint returns permissive CORS headers, so it's
 * callable directly from the browser. No auth needed for reads.
 * Source: https://github.com/UWFlow/uwflow
 */

const ENDPOINT = "https://uwflow.com/graphql"

export type FlowRating = {
  liked: number | null
  easy: number | null
  useful: number | null
  /** Number of rating submissions. */
  filled: number
  comments: number
}

/** "CS 136" -> "cs136" (UW Flow's code format). */
function toFlowCode(code: string): string {
  return code.toLowerCase().replace(/\s+/g, "")
}

const cache = new Map<string, FlowRating | null>()

type RawCourse = {
  code: string
  rating: {
    liked: number | null
    easy: number | null
    useful: number | null
    filled_count: number | null
    comment_count: number | null
  } | null
}

async function query(codes: string[]): Promise<RawCourse[]> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query ($codes: [String!]) {
        course(where: { code: { _in: $codes } }) {
          code
          rating { liked easy useful filled_count comment_count }
        }
      }`,
      variables: { codes },
    }),
  })
  if (!res.ok) throw new Error(`UW Flow ${res.status}`)
  const json = await res.json()
  return (json?.data?.course ?? []) as RawCourse[]
}

function normalize(raw: RawCourse["rating"]): FlowRating | null {
  if (!raw) return null
  return {
    liked: raw.liked,
    easy: raw.easy,
    useful: raw.useful,
    filled: raw.filled_count ?? 0,
    comments: raw.comment_count ?? 0,
  }
}

/** Fetch ratings for many courses at once. Returns a map keyed by display code. */
export async function getRatings(displayCodes: string[]): Promise<Map<string, FlowRating | null>> {
  const out = new Map<string, FlowRating | null>()
  const need: string[] = []
  const flowToDisplay = new Map<string, string>()

  for (const code of displayCodes) {
    const flow = toFlowCode(code)
    flowToDisplay.set(flow, code)
    if (cache.has(flow)) out.set(code, cache.get(flow)!)
    else need.push(flow)
  }

  if (need.length > 0) {
    try {
      const rows = await query(need)
      const byFlow = new Map(rows.map((r) => [r.code, normalize(r.rating)]))
      for (const flow of need) {
        const rating = byFlow.get(flow) ?? null
        cache.set(flow, rating)
        const display = flowToDisplay.get(flow)!
        out.set(display, rating)
      }
    } catch {
      for (const flow of need) out.set(flowToDisplay.get(flow)!, null)
    }
  }

  return out
}

export async function getRating(displayCode: string): Promise<FlowRating | null> {
  const map = await getRatings([displayCode])
  return map.get(displayCode) ?? null
}

/** Hook for a single course's UW Flow rating. */
export function useCourseRating(code: string | undefined) {
  const [rating, setRating] = useState<FlowRating | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!code) return
    let alive = true
    setLoading(true)
    getRating(code)
      .then((r) => alive && setRating(r))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [code])

  return { rating, loading }
}

/** Hook for many ratings (e.g. a list of course cards). */
export function useCourseRatings(codes: string[]) {
  const [ratings, setRatings] = useState<Map<string, FlowRating | null>>(new Map())
  const key = codes.join(",")

  useEffect(() => {
    if (codes.length === 0) return
    let alive = true
    getRatings(codes).then((m) => alive && setRatings(m))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return ratings
}
